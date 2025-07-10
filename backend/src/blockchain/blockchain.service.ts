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

async function generateUniqueTokenId(maxAttempts = 5): Promise<string> {
  // JavaScript Number가 안전하게 표현할 수 있는 최대 15자리 숫자: 9007199254740991
  // 이 범위 안에서 가장 큰 15자리 숫자를 목표로 합니다.
  // 실제 최대 안전 정수는 9,007,199,254,740,991 이므로
  // 15자리 숫자의 시작인 1,000,000,000,000,000 (1e14)부터
  // 안전한 최대값 (9,007,199,254,740,991)까지의 범위에서 생성합니다.
  const SAFE_MAX_INT = 9007199254740991; // Number.MAX_SAFE_INTEGER
  const MIN_15_DIGIT = 1000000000000000; // 10^14 (15자리 숫자의 최소값)

  for (let i = 0; i < maxAttempts; i++) {
    // 1) Number 타입의 안전한 범위 내에서 15자리 랜덤 숫자 생성
    // Math.random()은 0 (포함)에서 1 (제외) 사이의 값을 반환합니다.
    // 따라서 (SAFE_MAX_INT - MIN_15_DIGIT + 1) 범위의 랜덤 값을 생성한 후 MIN_15_DIGIT를 더합니다.
    const candidateNumber = Math.floor(Math.random() * (SAFE_MAX_INT - MIN_15_DIGIT + 1)) + MIN_15_DIGIT;
    const candidate = String(candidateNumber);

    // 2) DB에서 중복 확인
    const { data, error: queryErr } = await supabase
      .from('tickets')
      .select('id', { count: 'exact' })
      .eq('nft_token_id', candidate);

    if (queryErr) throw new Error('DB 중복 조회 실패: ' + queryErr.message);
    if ((data?.length ?? 0) === 0) {
      // 중복 없으니 이 ID 확정
      console.log(`✅ Number 안전 범위에서 유니크 토큰 ID 생성: ${candidate}`);
      return candidate;
    }
    // 중복이면 다음 루프에서 새로 뽑기
    console.log(`🔄 토큰 ID ${candidate}: DB에서 중복 발견, 재생성 중...`);
  }

  throw new Error('유니크 토큰 ID 생성에 실패했습니다 (재시도 한도 초과)');
}

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
  ): Promise<{ txHash: string; tokenId: string }> {
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

    const tokenId = await generateUniqueTokenId(5);

    try {
      // concertId를 bytes32로 변환
      const concertIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(concertId));
      
      const tx = await contractWithSigner.mintTicket(
        tokenId,
        concertIdBytes32,
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

  async getTokenURI(tokenId: number | string): Promise<string> {
    try {
      // BigInt로 변환하여 컨트랙트에 전달
      const tokenIdBigInt = BigInt(tokenId);
      return await this.contract.tokenURI(tokenIdBigInt);
    } catch (error: any) {
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  async getTokenOwner(tokenId: number | string): Promise<string> {
    try {
      // BigInt로 변환하여 컨트랙트에 전달
      const tokenIdBigInt = BigInt(tokenId);
      return await this.contract.ownerOf(tokenIdBigInt);
    } catch (error: any) {
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  /**
   * 입장 처리 (관리자 전용)
   */
  async markAsUsed(tokenId: number | string): Promise<void> {
    try {
      const adminSigner = new Wallet(ADMIN_KEY, PROVIDER);
      const contractWithAdmin = this.contract.connect(adminSigner);
      
      // BigInt로 변환하여 컨트랙트에 전달
      const tokenIdBigInt = BigInt(tokenId);
      
      // nonce 자동 관리 - 현재 nonce 확인
      const currentNonce = await adminSigner.getNonce();
      console.log(`🔢 입장 처리용 현재 관리자 nonce: ${currentNonce}`);
      
      // 입장 처리 - nonce 자동 관리 (명시적 지정 제거)
      const tx = await contractWithAdmin.markAsUsed(tokenIdBigInt, {
        gasLimit: 200_000n,
        maxFeePerGas,
        maxPriorityFeePerGas,
        // nonce: currentNonce, // 명시적 nonce 지정 제거
      });
      
      await tx.wait();
      console.log(`✅ 토큰 ${tokenId} 입장 처리 완료 (nonce: ${currentNonce})`);
    } catch (error: any) {
      console.error(`토큰 ${tokenId} 입장 처리 실패:`, error);
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  /**
   * 얼굴 해시 등록 (관리자 전용)
   */
  async registerFaceHash(tokenId: number | string, faceHash: string): Promise<string> {
    try {
      const adminSigner = new Wallet(ADMIN_KEY, PROVIDER);
      const contractWithAdmin = this.contract.connect(adminSigner);
      
      console.log(`🔐 얼굴 해시 등록 시작: 토큰 ${tokenId}, 해시 ${faceHash}`);
      
      // 얼굴 해시를 bytes32로 변환 (0x 접두사 제거 후 32바이트로 패딩)
      const hashBytes32 = faceHash.startsWith('0x') ? faceHash : `0x${faceHash}`;
      
      // BigInt로 변환하여 컨트랙트에 전달
      const tokenIdBigInt = BigInt(tokenId);
      
      const registerTx = await contractWithAdmin.registerFaceHash(tokenIdBigInt, hashBytes32, {
        gasLimit: 200_000n,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      
      const receipt = await registerTx.wait();
      console.log(`✅ 토큰 ${tokenId} 얼굴 해시 등록 완료: ${registerTx.hash}`);
      
      return registerTx.hash;
    } catch (error: any) {
      console.error(`토큰 ${tokenId} 얼굴 해시 등록 실패:`, error);
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }

  /**
   * 얼굴 인증 완료 처리 (관리자 전용)
   */
  async setFaceVerified(tokenId: number | string, faceHash?: string): Promise<string> {
    try {
      const adminSigner = new Wallet(ADMIN_KEY, PROVIDER);
      const contractWithAdmin = this.contract.connect(adminSigner);
      
      console.log(`🎭 얼굴 인증 완료 처리 시작: 토큰 ${tokenId}${faceHash ? `, 해시 ${faceHash}` : ''}`);
      
      // BigInt로 변환하여 컨트랙트에 전달
      const tokenIdBigInt = BigInt(tokenId);
      
      // 1. 현재 티켓 상태 확인 (이미 얼굴 해시가 등록되어 있는지 확인)
      const currentTicket = await this.contract.tickets(tokenIdBigInt);
      const hasExistingFaceHash = currentTicket.faceHash !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      
      console.log(`🔍 기존 얼굴 해시 상태: ${hasExistingFaceHash ? '이미 등록됨' : '미등록'}`);
      
      // 2. 얼굴 해시가 새로 제공되었고, 아직 등록되지 않은 경우에만 등록
      if (faceHash && !hasExistingFaceHash) {
        console.log('🔐 새로운 얼굴 해시 등록 중...');
        await this.registerFaceHash(tokenId, faceHash);
        console.log('✅ 얼굴 해시 등록 완료, 다음 단계 진행');
        
        // 짧은 대기 시간 (nonce 안정화)
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (faceHash && hasExistingFaceHash) {
        console.log('⏭️ 얼굴 해시가 이미 등록되어 있어 등록 과정을 건너뜁니다');
      } else if (!faceHash) {
        console.log('⚠️ 얼굴 해시 없이 기본 인증 처리');
      }
      
      // 3. 얼굴 인증 통과 표시 (이미 인증된 상태인지 확인)
      if (currentTicket.isFaceVerified) {
        console.log('✅ 이미 얼굴 인증이 완료된 티켓입니다');
        return 'already_verified'; // 기존 상태 반환
      }
      
      // 4. 최신 nonce 확인 후 얼굴 인증 통과 표시
      const currentNonce = await adminSigner.getNonce();
      console.log(`🔢 현재 관리자 nonce: ${currentNonce}`);
      
      const faceVerifyTx = await contractWithAdmin.markFaceVerified(tokenIdBigInt, {
        gasLimit: 200_000n,
        maxFeePerGas,
        maxPriorityFeePerGas,
        // nonce: currentNonce, // 명시적 nonce 지정 제거
      });
      
      const receipt = await faceVerifyTx.wait();
      console.log(`✅ 토큰 ${tokenId} 얼굴 인증 완료: ${faceVerifyTx.hash}`);
      
      return faceVerifyTx.hash;
    } catch (error: any) {
      console.error(`토큰 ${tokenId} 얼굴 인증 처리 실패:`, error);
      throw new Error(error.error?.message || error.reason || error.message);
    }
  }
}
