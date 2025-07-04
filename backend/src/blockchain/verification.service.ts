import { ethers } from 'ethers';
import { supabase } from '../lib/supabaseClient';
import { SoulboundTicket__factory } from '../../../blockchain/typechain';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../blockchain/.deployed') });

const RPC_URL = process.env.RPC_URL!;
const TICKET_MANAGER_ADDRESS = process.env.TICKET_MANAGER_ADDRESS!;
const PROVIDER = new ethers.JsonRpcProvider(RPC_URL);

export class BlockchainVerificationService {
  private contract: any;

  constructor() {
    if (!TICKET_MANAGER_ADDRESS) {
      throw new Error('TICKET_MANAGER_ADDRESS가 설정되지 않았습니다');
    }
    this.contract = SoulboundTicket__factory.connect(TICKET_MANAGER_ADDRESS, PROVIDER);
  }

  /**
   * 티켓 소유권 검증 (블록체인 + DB)
   */
  async verifyTicketOwnership(tokenId: number, userId: string): Promise<{
    isValid: boolean;
    dbOwner: string | null;
    blockchainOwner: string | null;
    userWallet: string | null;
    error?: string;
  }> {
    try {
      // 1. DB에서 티켓 정보 조회 (문자열로 통일)
      console.log('tokenId:', tokenId, 'typeof:', typeof tokenId);
      const { data: dbTicket, error: dbError } = await supabase
        .from('tickets')
        .select('*')
        .eq('nft_token_id', String(tokenId))
        .single();
      console.log('쿼리 결과:', dbTicket, dbError);

      if (dbError || !dbTicket) {
        return {
          isValid: false,
          dbOwner: null,
          blockchainOwner: null,
          userWallet: null,
          error: 'DB에서 티켓을 찾을 수 없습니다'
        };
      }

      // 2. 사용자 지갑 주소 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      if (userError || !userData?.wallet_address) {
        return {
          isValid: false,
          dbOwner: dbTicket.user_id,
          blockchainOwner: null,
          userWallet: null,
          error: '사용자 지갑 주소를 찾을 수 없습니다'
        };
      }

      // 3. 블록체인에서 실제 소유자 확인
      const blockchainOwner = await this.contract.ownerOf(tokenId);

      // 4. 검증 결과
      const dbMatches = dbTicket.user_id === userId;
      const blockchainMatches = blockchainOwner.toLowerCase() === userData.wallet_address.toLowerCase();

      return {
        isValid: dbMatches && blockchainMatches,
        dbOwner: dbTicket.user_id,
        blockchainOwner: blockchainOwner,
        userWallet: userData.wallet_address,
        error: !dbMatches ? 'DB 소유권 불일치' : !blockchainMatches ? '블록체인 소유권 불일치' : undefined
      };

    } catch (error) {
      console.error('티켓 소유권 검증 오류:', error);
      return {
        isValid: false,
        dbOwner: null,
        blockchainOwner: null,
        userWallet: null,
        error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 티켓 사용 상태 검증 (블록체인 + DB)
   */
  async verifyTicketUsageStatus(tokenId: number): Promise<{
    isValid: boolean;
    dbIsUsed: boolean | null;
    blockchainIsUsed: boolean | null;
    error?: string;
  }> {
    try {
      // 1. DB에서 사용 상태 조회 (문자열로 통일)
      const { data: dbTicket, error: dbError } = await supabase
        .from('tickets')
        .select('is_used')
        .eq('nft_token_id', String(tokenId))
        .single();

      if (dbError || !dbTicket) {
        return {
          isValid: false,
          dbIsUsed: null,
          blockchainIsUsed: null,
          error: 'DB에서 티켓을 찾을 수 없습니다'
        };
      }

      // 2. 블록체인에서 티켓 정보 조회
      const blockchainTicket = await this.contract.tickets(tokenId);

      // 3. 상태 일치성 검증
      const dbIsUsed = dbTicket.is_used;
      const blockchainIsUsed = blockchainTicket.isUsed;

      return {
        isValid: dbIsUsed === blockchainIsUsed,
        dbIsUsed,
        blockchainIsUsed,
        error: dbIsUsed !== blockchainIsUsed ? 'DB와 블록체인 사용 상태 불일치' : undefined
      };

    } catch (error) {
      console.error('티켓 사용 상태 검증 오류:', error);
      return {
        isValid: false,
        dbIsUsed: null,
        blockchainIsUsed: null,
        error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 얼굴 인증 상태 검증 (블록체인 + DB)
   */
  async verifyFaceVerificationStatus(tokenId: number, userId: string): Promise<{
    isValid: boolean;
    hasEmbedding: boolean;
    blockchainIsFaceVerified: boolean | null;
    error?: string;
  }> {
    try {
      // 1. DB에서 얼굴 임베딩 존재 여부 확인
      const { data: embeddingData, error: embeddingError } = await supabase
        .from('face_embeddings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (embeddingError) {
        return {
          isValid: false,
          hasEmbedding: false,
          blockchainIsFaceVerified: null,
          error: '얼굴 임베딩 조회 중 오류 발생'
        };
      }

      // 2. 블록체인에서 얼굴 인증 상태 확인
      const blockchainTicket = await this.contract.tickets(tokenId);

      // 3. 상태 일치성 검증
      const hasEmbedding = !!embeddingData;
      const blockchainIsFaceVerified = blockchainTicket.isFaceVerified;

      return {
        isValid: hasEmbedding === blockchainIsFaceVerified,
        hasEmbedding,
        blockchainIsFaceVerified,
        error: hasEmbedding !== blockchainIsFaceVerified ? 'DB와 블록체인 얼굴 인증 상태 불일치' : undefined
      };

    } catch (error) {
      console.error('얼굴 인증 상태 검증 오류:', error);
      return {
        isValid: false,
        hasEmbedding: false,
        blockchainIsFaceVerified: null,
        error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 티켓 취소 상태 검증 (블록체인 + DB)
   */
  async verifyTicketCancellationStatus(tokenId: number): Promise<{
    isValid: boolean;
    dbIsCancelled: boolean | null;
    blockchainIsCancelled: boolean | null;
    error?: string;
  }> {
    try {
      // 1. DB에서 취소 상태 조회 (문자열로 통일)
      const { data: dbTicket, error: dbError } = await supabase
        .from('tickets')
        .select('is_cancelled')
        .eq('nft_token_id', String(tokenId))
        .single();

      if (dbError || !dbTicket) {
        return {
          isValid: false,
          dbIsCancelled: null,
          blockchainIsCancelled: null,
          error: 'DB에서 티켓을 찾을 수 없습니다'
        };
      }

      // 2. 블록체인에서 취소 상태 확인
      const blockchainIsCancelled = await this.contract.isCancelled(tokenId);

      // 3. 상태 일치성 검증
      const dbIsCancelled = dbTicket.is_cancelled;

      return {
        isValid: dbIsCancelled === blockchainIsCancelled,
        dbIsCancelled,
        blockchainIsCancelled,
        error: dbIsCancelled !== blockchainIsCancelled ? 'DB와 블록체인 취소 상태 불일치' : undefined
      };

    } catch (error) {
      console.error('티켓 취소 상태 검증 오류:', error);
      return {
        isValid: false,
        dbIsCancelled: null,
        blockchainIsCancelled: null,
        error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 입장 검증 (종합적인 티켓 상태 확인)
   */
  async verifyTicketForEntry(tokenId: number, userId: string): Promise<{
    canEnter: boolean;
    exists: boolean;
    isUsed: boolean | null;
    isFaceVerified: boolean | null;
    isCancelled: boolean | null;
    ownershipValid: boolean;
    errors: string[];
  }> {
    try {
      // 1. 블록체인에서 티켓 정보 조회
      const blockchainTicket = await this.contract.tickets(tokenId);
      const exists = blockchainTicket.issuedAt > 0;

      if (!exists) {
        return {
          canEnter: false,
          exists: false,
          isUsed: null,
          isFaceVerified: null,
          isCancelled: null,
          ownershipValid: false,
          errors: ['티켓이 존재하지 않습니다']
        };
      }

      // 2. 각종 검증 수행
      const [ownershipResult, usageResult, faceResult, cancellationResult] = await Promise.all([
        this.verifyTicketOwnership(tokenId, userId),
        this.verifyTicketUsageStatus(tokenId),
        this.verifyFaceVerificationStatus(tokenId, userId),
        this.verifyTicketCancellationStatus(tokenId)
      ]);

      const errors: string[] = [];
      
      if (ownershipResult.error) errors.push(ownershipResult.error);
      if (usageResult.error) errors.push(usageResult.error);
      if (faceResult.error) errors.push(faceResult.error);
      if (cancellationResult.error) errors.push(cancellationResult.error);

      // 3. 입장 가능 여부 판단
      const canEnter = 
        ownershipResult.isValid &&
        usageResult.isValid &&
        faceResult.isValid &&
        cancellationResult.isValid &&
        !blockchainTicket.isUsed &&
        blockchainTicket.isFaceVerified &&
        !cancellationResult.blockchainIsCancelled;

      return {
        canEnter,
        exists: true,
        isUsed: blockchainTicket.isUsed,
        isFaceVerified: blockchainTicket.isFaceVerified,
        isCancelled: cancellationResult.blockchainIsCancelled,
        ownershipValid: ownershipResult.isValid,
        errors
      };

    } catch (error) {
      console.error('입장 검증 오류:', error);
      return {
        canEnter: false,
        exists: false,
        isUsed: null,
        isFaceVerified: null,
        isCancelled: null,
        ownershipValid: false,
        errors: [`검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]
      };
    }
  }

  /**
   * 중복 민팅 방지 검증
   */
  async verifyMintingEligibility(userWalletAddress: string, concertId: string): Promise<{
    canMint: boolean;
    hasAlreadyMinted: boolean;
    error?: string;
  }> {
    try {
      // 콘서트 ID를 bytes32로 변환 (keccak256 해시)
      const concertHash = ethers.keccak256(ethers.toUtf8Bytes(concertId));
      
      // 블록체인에서 중복 민팅 여부 확인
      const hasAlreadyMinted = await this.contract.hasMintedForConcert(userWalletAddress, concertHash);

      return {
        canMint: !hasAlreadyMinted,
        hasAlreadyMinted,
        error: hasAlreadyMinted ? '이미 해당 공연에 대한 티켓을 민팅했습니다' : undefined
      };

    } catch (error) {
      console.error('민팅 자격 검증 오류:', error);
      return {
        canMint: false,
        hasAlreadyMinted: false,
        error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }
}

export const blockchainVerification = new BlockchainVerificationService(); 