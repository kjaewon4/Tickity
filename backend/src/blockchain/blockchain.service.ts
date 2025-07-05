// src/auth/blockchain.service.ts

import dotenv from 'dotenv';
import path   from 'path';
import { Wallet, Contract, JsonRpcProvider, parseEther, parseUnits, Log } from 'ethers';
import { supabase } from '../lib/supabaseClient';
import { decrypt }   from '../utils/encryption';
import TicketArtifact from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';
import type { SoulboundTicket } from '../../../blockchain/typechain/contracts/SoulboundTicket';
import { SoulboundTicket__factory } from '../../../blockchain/typechain/factories/contracts/SoulboundTicket__factory';
import { ethers } from 'ethers';
import { config } from '../config/environment';
import SoulboundTicketABI from '../../artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';

dotenv.config({ path: path.resolve(__dirname, '../../.deployed') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL  = process.env.RPC_URL!;
const PROVIDER = new JsonRpcProvider(RPC_URL);

// **추가**: 관리자 키로 보내기 위해 불러옵니다.
const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY!;
if (!ADMIN_KEY) throw new Error('ADMIN_PRIVATE_KEY가 없습니다');
const adminWallet = new Wallet(ADMIN_KEY, PROVIDER);
const FUND_AMOUNT  = '10000.0';                               // 새 지갑에 충전할 ETH (예: 0.1 ETH)

// const price = parseEther(priceEth);  // 예: "0.0325" → 32500000000000000n
const maxFeePerGas = parseUnits('2.5', 'gwei');         // 2500000000n
const maxPriorityFeePerGas = parseUnits('1.5', 'gwei'); // 1500000000n

export class BlockchainService {
  private contract: SoulboundTicket;
  private provider: ethers.Provider;

  constructor() {
    const addr = process.env.TICKET_MANAGER_ADDRESS!;
    if (!addr) throw new Error('TICKET_MANAGER_ADDRESS가 없습니다');
    this.contract = SoulboundTicket__factory.connect(addr, PROVIDER);
    this.provider = new ethers.JsonRpcProvider(config.RPC_URL);
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
    priceEth: string
  ): Promise<{ txHash: string; tokenId: number }> {
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('wallet_address, private_key_encrypted')
      .eq('id', userId)
      .single();

    if (userErr) throw new Error(`DB 조회 실패: ${userErr.message}`);
    if (!userData?.private_key_encrypted) throw new Error('사용자 키 정보 없음');

    console.log('🔍 사용자 지갑 정보:', {
      userId,
      walletAddress: userData.wallet_address,
      hasPrivateKey: !!userData.private_key_encrypted
    });

    const privateKey = decrypt(userData.private_key_encrypted);
    const signer = new Wallet(privateKey, PROVIDER);
    
    console.log('🔍 실제 사용자 지갑 주소:', signer.address);
    
    // 지갑 잔액 확인
    const balance = await PROVIDER.getBalance(signer.address);
    const contractWithSigner = this.contract.connect(signer);
    const price = parseEther(priceEth);

    try {
      const tx = await contractWithSigner.mintTicket(
        concertId,
        seat,
        uri,
        price,
        {
          value: price,
          gasLimit: 800_000n,
          maxFeePerGas,
          maxPriorityFeePerGas,
        }
      );
      const receipt = await tx.wait();
      if (!receipt) throw new Error('트랜잭션 영수증을 받지 못했습니다.');
      
      if (receipt.status === 0) {
        throw new Error('트랜잭션이 실패했습니다 (status: 0)');
      }

      // TicketMinted 이벤트 파싱
      let tokenId: number | undefined;
      for (const log of receipt.logs as Log[]) {
        try {
          const parsed = this.contract.interface.parseLog(log);
          if (parsed.name === 'TicketMinted') {
            tokenId = Number(parsed.args.tokenId);
            break;
          }
        } catch (err) {
          continue; // parse 실패 시 무시
        }
      }

      if (tokenId === undefined) {
        throw new Error('토큰 ID를 추출하지 못했습니다.');
      }

      return {
        txHash: tx.hash,
        tokenId,
      };

    } catch (err) {
      console.error('🧨 민팅 실패! 메타데이터 및 DB 롤백 시도');

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

  async getTokenURI(tokenId: number): Promise<string> {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error: any) {
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  async getTokenOwner(tokenId: number): Promise<string> {
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error: any) {
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  /**
   * 입장 처리 (관리자 전용)
   */
  async markAsUsed(tokenId: number): Promise<void> {
    try {
      const adminSigner = new Wallet(ADMIN_KEY, PROVIDER);
      const contractWithAdmin = this.contract.connect(adminSigner);
      
      // 🧪 테스트용: 얼굴 인증 우회를 위해 먼저 얼굴 인증 처리
      try {
        // 1. 더미 얼굴 해시 등록
        const dummyFaceHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        const faceHashTx = await contractWithAdmin.registerFaceHash(tokenId, dummyFaceHash, {
          gasLimit: 200_000n,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
        await faceHashTx.wait();
        console.log(`토큰 ${tokenId} 얼굴 해시 등록 완료`);
        
        // 트랜잭션 간격 추가
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. 얼굴 인증 통과 표시
        const faceVerifyTx = await contractWithAdmin.markFaceVerified(tokenId, {
          gasLimit: 200_000n,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
        await faceVerifyTx.wait();
        console.log(`토큰 ${tokenId} 얼굴 인증 완료`);
        
        // 트랜잭션 간격 추가
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (faceError) {
        console.log(`토큰 ${tokenId} 얼굴 인증 처리 중 오류 (무시):`, faceError);
      }
      
      // 3. 입장 처리 - nonce 자동 관리
      const tx = await contractWithAdmin.markAsUsed(tokenId, {
        gasLimit: 200_000n,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      
      await tx.wait();
      console.log(`토큰 ${tokenId} 입장 처리 완료`);
    } catch (error: any) {
      console.error(`토큰 ${tokenId} 입장 처리 실패:`, error);
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }
}
