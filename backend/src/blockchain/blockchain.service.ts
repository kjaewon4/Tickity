// src/auth/blockchain.service.ts

import dotenv from 'dotenv';
import path   from 'path';
import { Wallet, Contract, JsonRpcProvider, parseEther, parseUnits } from 'ethers';
import { supabase } from '../lib/supabaseClient';
import { decrypt }   from '../utils/encryption';
import TicketArtifact from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';

dotenv.config({ path: path.resolve(__dirname, '../../.deployed') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL  = process.env.RPC_URL!;
const PROVIDER = new JsonRpcProvider(RPC_URL);

// **추가**: 관리자 키로 보내기 위해 불러옵니다.
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY!;
if (!ADMIN_KEY) throw new Error('ADMIN_PRIVATE_KEY가 없습니다');
const adminWallet = new Wallet(ADMIN_KEY, PROVIDER);
const FUND_AMOUNT  = '1.0';                               // 새 지갑에 충전할 ETH (예: 0.1 ETH)

// const price = parseEther(priceEth);  // 예: "0.0325" → 32500000000000000n
const maxFeePerGas = parseUnits('2.5', 'gwei');         // 2500000000n
const maxPriorityFeePerGas = parseUnits('1.5', 'gwei'); // 1500000000n

export class BlockchainService {
  private contract: Contract;


  constructor() {
    const addr = process.env.TICKET_MANAGER_ADDRESS!;
    if (!addr) throw new Error('TICKET_MANAGER_ADDRESS가 없습니다');
    this.contract = new Contract(addr, TicketArtifact.abi, PROVIDER);
  }

  /** on-demand 지갑 생성 + 관리자로부터 ETH 충전 */
  async createUserWallet(): Promise<{ address: string; privateKey: string }> {
    // 1) 랜덤 지갑 생성
    const wallet = Wallet.createRandom().connect(PROVIDER);
    const { address, privateKey } = wallet;

    // 2) 관리자 지갑에서 새 지갑으로 FUND_AMOUNT 만큼 전송
    const tx = await adminWallet.sendTransaction({
      to: address,
      value: parseEther(FUND_AMOUNT)
    });
    await tx.wait();

    const balance = await PROVIDER.getBalance(address);
    console.log(`🧾 지갑 생성 후 잔액 확인: ${balance.toString()} wei`);

    return { address, privateKey };
  }

  /**
   * 서버에서 티켓 민팅
   */
  async mintTicket(
    userId: string,
    concertId: number,
    seat: string,
    uri: string,
    priceEth: string
  ): Promise<{ txHash: string; tokenId: number }> {

    
    // 1. 사용자 키 조회
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('wallet_address, private_key_encrypted')
      .eq('id', userId)
      .single();
    if (userErr) throw new Error(`DB 조회 실패: ${userErr.message}`);
    if (!userData?.private_key_encrypted) throw new Error('사용자 키 정보 없음');

    console.log('🔐 Encrypted Key:', userData.private_key_encrypted);

    // 2. 개인키 복호화
    const privateKey = decrypt(userData.private_key_encrypted);
    console.log('🔓 Decrypted Key:', privateKey);


    // 3. 서명자 지갑 연결
    const signer = new Wallet(privateKey, PROVIDER);
    const contractWithSigner = this.contract.connect(signer) as any;

    // 4. 트랜잭션 실행
    const price = parseEther(priceEth);
    const tx = await contractWithSigner.mintTicket(
      concertId,
      seat,
      uri,
      price,
      { value: price,
        gasLimit: 300000n,                            // 적절한 가스 리밋 수동 설정
        maxFeePerGas,     // EIP-1559 수수료 수동 설정
        maxPriorityFeePerGas 
      }
    );
    const receipt = await tx.wait();
    console.log("💸 price (wei):", price.toString());

    // 5. 토큰 ID 추출 (첫 번째 이벤트 로그에서)
    // 민팅된 티켓이 몇 번 토큰인지 기록해야 나중에 티켓 검증, 조회, 얼굴 인증 등에 사용
    const tokenId =
      receipt?.events?.find((e:any) => e.event === 'Transfer')?.args?.tokenId?.toNumber?.() ??
      -1;

    return {
      txHash: tx.hash,
      tokenId,
    };
  }

}
