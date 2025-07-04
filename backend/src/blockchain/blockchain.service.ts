// src/auth/blockchain.service.ts

import dotenv from 'dotenv';
import path   from 'path';
import { Wallet, Contract, JsonRpcProvider, parseEther, parseUnits, Log  } from 'ethers';
import { supabase } from '../lib/supabaseClient';
import { decrypt }   from '../utils/encryption';
import type { SoulboundTicket } from '../../../blockchain/typechain/contracts/SoulboundTicket';
import { SoulboundTicket__factory } from '../../../blockchain/typechain/factories/contracts/SoulboundTicket__factory';
import { Interface } from 'ethers/lib/utils';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL  = process.env.RPC_URL!;
const PROVIDER = new JsonRpcProvider(RPC_URL);

// **추가**: 관리자 키로 보내기 위해 불러옵니다.
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY!;
if (!ADMIN_KEY) throw new Error('ADMIN_PRIVATE_KEY가 없습니다');
const adminWallet = new Wallet(ADMIN_KEY, PROVIDER);
const FUND_AMOUNT  = '1000.0';                               // 새 지갑에 충전할 ETH (예: 0.1 ETH)

// const price = parseEther(priceEth);  // 예: "0.0325" → 32500000000000000n
const maxFeePerGas = parseUnits('2.5', 'gwei');         // 2500000000n
const maxPriorityFeePerGas = parseUnits('1.5', 'gwei'); // 1500000000n

export class BlockchainService {
  private contract: SoulboundTicket;

  constructor() {
    const addr = process.env.TICKET_MANAGER_ADDRESS!;
    console.log('addr', addr);

    if (!addr) throw new Error('TICKET_MANAGER_ADDRESS가 없습니다');
    this.contract = SoulboundTicket__factory.connect(addr, PROVIDER);
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
    concertId: string,
    ticketId: string,
    seat: string,
    uri: string,
    priceEth: string  // <-- 이 priceEth가 ETH 단위로 변환된 값 (예: "0.033025")
  ): Promise<{ txHash: string; tokenId: number }> {
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('wallet_address, private_key_encrypted')
      .eq('id', userId)
      .single();

    if (userErr) throw new Error(`DB 조회 실패: ${userErr.message}`);
    if (!userData?.private_key_encrypted) throw new Error('사용자 키 정보 없음');

    const privateKey = decrypt(userData.private_key_encrypted);
    const signer = new Wallet(privateKey, PROVIDER);
    const contractWithSigner = this.contract.connect(signer);
    const price = parseEther(priceEth);  // price는 BigInt (wei 단위)

    try {
      const tx = await contractWithSigner.mintTicket(
        concertId,
        seat,
        uri,
        price,  // <-- 컨트랙트의 'uint256 price' 파라미터로 이 wei 값을 전달
        {
          value: price,  // <-- msg.value로도 이 wei 값을 전달
          gasLimit: 800_000n,
          maxFeePerGas,
          maxPriorityFeePerGas,
        }
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('트랜잭션 영수증을 받지 못했습니다.');

      // 추가: 트랜잭션 상태 확인
      if (receipt.status === 0) { // status가 0이면 트랜잭션이 실패했음을 의미
          console.error('❌ 블록체인 트랜잭션 실패! (Reverted)');
          // 여기에 revert reason을 가져오는 로직을 추가하면 더욱 좋습니다.
          // 예를 들어, ethers-decode-error 라이브러리를 사용하거나,
          // Etherscan 등에서 트랜잭션 trace를 분석하여 revert reason을 파악해야 합니다.
          // 임시 방편으로, 트랜잭션 해시를 로그에 남겨 수동 분석하도록 합니다.
          console.error('트랜잭션 해시:', tx.hash);
          throw new Error(`블록체인 트랜잭션 실패 (해시: ${tx.hash}). Smart Contract Reverted.`);
      }

        console.log('🪵 Raw logs:', receipt.logs);
        console.log('🔍 logs.length:', receipt.logs.length);
        console.log('receipt: ', receipt);
        
        receipt.logs.forEach((log, i) => {
        console.log(`🔍 log[${i}].topics:`, log.topics);
        console.log(`🔍 log[${i}].data:`, log.data);
      });


      // TicketMinted 이벤트 파싱
      let tokenId: number | undefined;
      // for (const log of receipt.logs as Log[]) {
      //   try {
      //     const parsed = this.contract.interface.parseLog(log);
      //     if (parsed && parsed.name === 'TicketMinted') {
      //       tokenId = Number(parsed.args.tokenId);
      //       console.log('✅ TicketMinted 이벤트 파싱 완료:', tokenId);
      //       break;
      //     }
      //   } catch (err) {
      //     console.error('❌ parseLog 실패:', err);
      //     console.log('⛔ Raw log that failed:', log);
      //   }
      // }
      for (const log of receipt.logs as Log[]) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === 'TicketMinted') {
          const tokenId = Number(parsed.args.tokenId);
          console.log('✅ 이벤트에서 tokenId 파싱 성공:', tokenId);
          return { txHash: tx.hash, tokenId };
        }
      } catch (err) {
        console.error('❌ parseLog 실패:', err);
        console.log('⛔ raw log:', log);
      }
    }

console.log('contract.address:', this.contract.target);

      if (tokenId === undefined) {
        throw new Error('토큰 ID를 추출하지 못했습니다.');
      }

      return {
        txHash: tx.hash,
        tokenId,
      };

    } catch (err) {
      console.error('🧨 민팅 실패! 메타데이터 및 DB 롤백 시도');
      console.error('🔥 원본 오류 객체:', err); // err 객체 전체를 출력하여 분석

      // 롤백
      try {
        const { error: storageError } = await supabase.storage
          .from('metadata')
          .remove([`tickets/${ticketId}.json`]);
        if (storageError) {
          console.error('❌ 메타데이터 삭제 실패:', storageError.message);
        }

        const { error: deleteError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', ticketId);
        if (deleteError) {
          console.error('❌ 티켓 DB 삭제 실패:', deleteError.message);
        }
      } catch (cleanupErr) {
        console.error('🔥 롤백 중 예외 발생:', cleanupErr);
      }

      throw err;
    }
  }

}
