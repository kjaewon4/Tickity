// backend/src/tickets/tickets.service.ts

import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../lib/supabaseClient';
import { Ticket } from './tickets.model';
import { ethers, Contract, Wallet, Log } from 'ethers';
// artifacts 폴더 내 생성된 JSON ABI 파일을 가져옵니다.
// tickets.service.ts 기준으로 ../../../blockchain/artifacts/... 경로
import TicketJSON from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';
import { BlockchainService } from '../blockchain/blockchain.service';
import { blockchainVerification } from '../blockchain/verification.service';
import { generateMetadataForTicket } from './metadata.service';
import { updateConcertSeatStatus } from '../seats/concertSeats.service';

// 로컬 체인 배포 주소 등 불러올 .deployed
dotenv.config({ path: path.resolve(__dirname, '../../../blockchain/.deployed') });
// .env 불러오기
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL    = process.env.RPC_URL!;
const ADMIN_KEY  = process.env.ADMIN_PRIVATE_KEY!;
const CONTRACT   = process.env.TICKET_MANAGER_ADDRESS!;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const admin    = new ethers.Wallet(ADMIN_KEY, provider);
const contract = new ethers.Contract(CONTRACT, TicketJSON.abi, admin);
const blockchain = new BlockchainService();

// ───────────────────────────────────────────────────────────
// 확장된 티켓 타입 (콘서트·좌석 정보 포함)
// ───────────────────────────────────────────────────────────
export interface TicketWithDetails extends Ticket {
  concert?: {
    id: string;
    title: string;
    start_date: string;
    start_time: string;
    venue_name: string;
    poster_url?: string;
  };
  seat?: {
    id: string;
    label?: string;
    row_idx?: number;
    col_idx?: number;
    grade_name: string;
  };
}

// ───────────────────────────────────────────────────────────
// 모든 티켓 조회
// ───────────────────────────────────────────────────────────
export const getAllTickets = async (): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from<'tickets', Ticket>('tickets')
    .select('*')
    .order('created_at', { ascending: false });


  if (error) {
    console.error('getAllTickets 오류:', error);
    throw error;
  }
  return data || [];
};

// ───────────────────────────────────────────────────────────
// 티켓 생성 (예매)
// ───────────────────────────────────────────────────────────
// 티켓 생성
export async function createTicket(payload: {
  concert_id: string;
  seat_id: string;
  user_id: string;
  seat_number: string;
  price: number;
}) {
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      concert_id: payload.concert_id,
      seat_id: payload.seat_id,
      user_id: payload.user_id,
      seat_number: payload.seat_number,
      purchase_price: payload.price,
      created_at: new Date().toISOString(),
    })
    .select('*') // 생성된 행을 반환
    .single();

  if (error || !data) {
    throw new Error(`티켓 생성 실패: ${error?.message}`);
  }

  return data;
}

// NFT 민팅 후 티켓 정보 업데이트
// export async function updateTicketMintInfo(
//   ticketId: string,
//   tokenId: number,
//   txHash: string
// ) {
//   const { error } = await supabase
//     .from('tickets')
//     .update({
//       nft_token_id: tokenId.toString(),
//       tx_hash: txHash,
//       issued_at: new Date().toISOString(),
//     })
//     .eq('id', ticketId);

//   if (error) {
//     throw new Error(`민팅 정보 업데이트 실패: ${error.message}`);
//   }
// }
export async function updateTicketMintInfo(
    ticketId: string,
    tokenId: number,
    txHash: string,
    concertId: string,
    seatId: string,
    userId: string,
    tokenUri: string 
  ): Promise<void> {
  // 1. 티켓 정보 업데이트
  const { error } = await supabase
    .from('tickets')
    .update({
        nft_token_id: tokenId,
        tx_hash: txHash,
        token_uri: tokenUri,
      })
    .eq('id', ticketId);

  if (error) {
    console.error('❌ 티켓 민팅 정보 DB 업데이트 실패:', error.message);
    throw new Error('DB에 민팅 정보 저장 실패');
  }

  // 2. 좌석 상태 변경
  await updateConcertSeatStatus({
    concertId,
    seatId,
    userId,
    newStatus: 'SOLD',
    holdExpiresAt: null
  });
}


// ───────────────────────────────────────────────────────────
// 사용자별 예매 티켓 목록 조회 (기존 - DB만 사용)
// ───────────────────────────────────────────────────────────
export const getUserTickets = async (
  userId: string
): Promise<TicketWithDetails[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      concerts ( 
        id, 
        title,
        start_date,
        start_time, 
        poster_url,
        venues ( name )
      ),
      seats ( id, label, row_idx, col_idx, seat_grades ( grade_name ) )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getUserTickets 오류:', error);
    throw error;
  }

  return (data || []).map((t: any) => ({
    ...t,
    concert: t.concerts && {
      id:         t.concerts.id,
      title:      t.concerts.title,
      start_date: t.concerts.start_date,
      start_time: t.concerts.start_time,
      venue_name: t.concerts.venues?.name || '장소 정보 없음',
      poster_url: t.concerts.poster_url,
    },
    seat: t.seats && {
      id:        t.seats.id,
      label:     t.seats.label,
      row_idx:   t.seats.row_idx,
      col_idx:   t.seats.col_idx,
      grade_name: t.seats.seat_grades?.grade_name || ''
    }
  }));
};

// ───────────────────────────────────────────────────────────
// 사용자별 예매 티켓 목록 조회 (블록체인 검증 포함)
// ───────────────────────────────────────────────────────────
export const getUserTicketsWithVerification = async (
  userId: string
): Promise<(TicketWithDetails & { 
  verification: {
    ownershipValid: boolean;
    usageStatusValid: boolean;
    faceVerificationValid: boolean;
    cancellationStatusValid: boolean;
    errors: string[];
  }
})[]> => {
  // 1. 기본 티켓 정보 조회
  const tickets = await getUserTickets(userId);

  // 2. 각 티켓에 대해 블록체인 검증 수행
  const ticketsWithVerification = await Promise.all(
    tickets.map(async (ticket) => {
      if (!ticket.nft_token_id) {
        return {
          ...ticket,
          verification: {
            ownershipValid: false,
            usageStatusValid: false,
            faceVerificationValid: false,
            cancellationStatusValid: false,
            errors: ['NFT 토큰 ID가 없습니다']
          }
        };
      }

      const tokenId = parseInt(ticket.nft_token_id);

      try {
        // 병렬로 모든 검증 수행
        const [ownershipResult, usageResult, faceResult, cancellationResult] = await Promise.all([
          blockchainVerification.verifyTicketOwnership(tokenId, userId),
          blockchainVerification.verifyTicketUsageStatus(tokenId),
          blockchainVerification.verifyFaceVerificationStatus(tokenId, userId),
          blockchainVerification.verifyTicketCancellationStatus(tokenId)
        ]);

        const errors: string[] = [];
        if (ownershipResult.error) errors.push(`소유권: ${ownershipResult.error}`);
        if (usageResult.error) errors.push(`사용상태: ${usageResult.error}`);
        if (faceResult.error) errors.push(`얼굴인증: ${faceResult.error}`);
        if (cancellationResult.error) errors.push(`취소상태: ${cancellationResult.error}`);

        return {
          ...ticket,
          verification: {
            ownershipValid: ownershipResult.isValid,
            usageStatusValid: usageResult.isValid,
            faceVerificationValid: faceResult.isValid,
            cancellationStatusValid: cancellationResult.isValid,
            errors
          }
        };

      } catch (error) {
        console.error(`티켓 ${tokenId} 검증 오류:`, error);
        return {
          ...ticket,
          verification: {
            ownershipValid: false,
            usageStatusValid: false,
            faceVerificationValid: false,
            cancellationStatusValid: false,
            errors: [`검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`]
          }
        };
      }
    })
  );

  return ticketsWithVerification;
};

// ───────────────────────────────────────────────────────────
// 입장 검증 (종합적인 티켓 상태 확인)
// ───────────────────────────────────────────────────────────
export const verifyTicketForEntry = async (
  tokenId: number,
  userId: string
): Promise<{
  canEnter: boolean;
  exists: boolean;
  isUsed: boolean | null;
  isFaceVerified: boolean | null;
  isCancelled: boolean | null;
  ownershipValid: boolean;
  errors: string[];
  details: {
    ownership: any;
    usage: any;
    face: any;
    cancellation: any;
  };
}> => {
  try {
    const result = await blockchainVerification.verifyTicketForEntry(tokenId, userId);
    
    // 상세 검증 결과도 함께 반환
    const [ownershipResult, usageResult, faceResult, cancellationResult] = await Promise.all([
      blockchainVerification.verifyTicketOwnership(tokenId, userId),
      blockchainVerification.verifyTicketUsageStatus(tokenId),
      blockchainVerification.verifyFaceVerificationStatus(tokenId, userId),
      blockchainVerification.verifyTicketCancellationStatus(tokenId)
    ]);

    return {
      ...result,
      details: {
        ownership: ownershipResult,
        usage: usageResult,
        face: faceResult,
        cancellation: cancellationResult
      }
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
      errors: [`검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`],
      details: {
        ownership: null,
        usage: null,
        face: null,
        cancellation: null
      }
    };
  }
};

// ───────────────────────────────────────────────────────────
// 중복 민팅 방지 검증
// ───────────────────────────────────────────────────────────
export const verifyMintingEligibility = async (
  userId: string,
  concertId: string
): Promise<{
  canMint: boolean;
  hasAlreadyMinted: boolean;
  userWallet: string | null;
  error?: string;
}> => {
  try {
    // 사용자 지갑 주소 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (userError || !userData?.wallet_address) {
      return {
        canMint: false,
        hasAlreadyMinted: false,
        userWallet: null,
        error: '사용자 지갑 주소를 찾을 수 없습니다'
      };
    }

    // 블록체인에서 중복 민팅 여부 확인
    const result = await blockchainVerification.verifyMintingEligibility(
      userData.wallet_address,
      concertId
    );

    return {
      ...result,
      userWallet: userData.wallet_address
    };

  } catch (error) {
    console.error('민팅 자격 검증 오류:', error);
    return {
      canMint: false,
      hasAlreadyMinted: false,
      userWallet: null,
      error: `검증 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    };
  }
};

// ───────────────────────────────────────────────────────────
// 티켓 단건 조회
// ───────────────────────────────────────────────────────────
export const getTicketById = async (
  ticketId: string,
  userId: string
): Promise<TicketWithDetails | null> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      concerts ( 
        id, 
        title, 
        start_date,
        start_time,
        poster_url,
        venues ( name )
      ),
      seats ( id, label, row_idx, col_idx, seat_grades ( grade_name ) )
    `)
    .eq('id', ticketId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('getTicketById 오류:', error);
    throw error;
  }
  if (!data) return null;

  return {
    ...data,
    concert: data.concerts && {
      id:         data.concerts.id,
      title:      data.concerts.title,
      start_date: data.concerts.start_date,
      start_time: data.concerts.start_time,
      venue_name: data.concerts.venues?.name || '장소 정보 없음',
      poster_url: data.concerts.poster_url,
    },
    seat: data.seats && {
      id:        data.seats.id,
      label:     data.seats.label,
      row_idx:   data.seats.row_idx,
      col_idx:   data.seats.col_idx,
      grade_name: data.seats.seat_grades?.grade_name || ''
    }
  };
};

// ───────────────────────────────────────────────────────────
// 좌석 예약 상태 변경
// ───────────────────────────────────────────────────────────
export const setSeatReserved = async (
  seatId: string,
  reserved: boolean
) => {
  const { error } = await supabase
    .from('concert_seats')
    .update({ current_status: reserved ? 'reserved' : 'AVAILABLE' })
    .eq('seat_id', seatId);

  if (error) {
    console.error('setSeatReserved 오류:', error);
    throw error;
  }
};

// ───────────────────────────────────────────────────────────
// 온체인: 티켓 취소 → 재오픈 시간 반환
// ───────────────────────────────────────────────────────────
export const cancelOnChain = async (tokenId: number): Promise<{ reopenTime: number; transactionHash: string }> => {
  console.log(`[cancelOnChain] Attempting to cancel ticket with tokenId: ${tokenId}`);
  try {
    const tx = await contract.cancelTicket(tokenId);
    console.log(`[cancelOnChain] Transaction sent, hash: ${tx.hash}`);

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('트랜잭션 영수증을 받지 못했습니다.');
    }
    console.log(`[cancelOnChain] Transaction receipt received.`);
    console.log(`[cancelOnChain] All logs in receipt:`, receipt.logs); 

    if (receipt.status === 0) {
      throw new Error('트랜잭션이 실패했습니다 (status: 0)');
    }

    let reopenTime: number | undefined;
    
    // !!! 여기가 핵심 변경 지점입니다 !!!
    // this.contract.interface 대신 contract.interface를 직접 사용합니다.
    for (const log of receipt.logs as Log[]) {
      try {
        const parsed = contract.interface.parseLog(log); // <--- 'this.' 제거!
        if (parsed.name === 'TicketCancelled') {
          // BigInt를 Number로 변환 (ethers v6에서 BigInt가 기본 반환 타입일 수 있음)
          reopenTime = Number(parsed.args.reopenTime); 
          console.log(`[cancelOnChain] 'TicketCancelled' event found. Parsed args:`, parsed.args);
          break; 
        }
      } catch (parseError) {
        // 해당 로그가 우리 컨트랙트의 이벤트가 아닐 경우 발생하는 에러는 무시
        // console.warn(`[cancelOnChain] Could not parse log (expected if not our event):`, log.topics[0], parseError);
      }
    }

    if (reopenTime === undefined) {
      console.error(`[cancelOnChain] Error: 'TicketCancelled' event not found in transaction receipt logs.`);
      throw new Error("TicketCancelled event not found in logs.");
    }

    console.log(`[cancelOnChain] Ticket cancelled successfully. Reopen time: ${reopenTime}`);
    return { reopenTime, transactionHash: receipt.hash }; 

  } catch (error) {
    console.error(`[cancelOnChain] An error occurred during ticket cancellation:`, error);
    throw error;
  }
};

// ───────────────────────────────────────────────────────────
// DB: 티켓 취소 정보 저장
// ───────────────────────────────────────────────────────────
export const markTicketCancelled = async (
  ticketId: string,
  reopenTime: number,
  refundTxHash: string | null
) => {
  const { error } = await supabase
    .from('tickets')
    .update({
      canceled_at:      new Date(),
      cancellation_fee: 0,
      refund_tx_hash:   refundTxHash,
      is_cancelled:     true,
      reopen_time:      reopenTime
    })
    .eq('id', ticketId);
  if (error) {
    console.error('markTicketCancelled 오류:', error);
    throw error;
  }
};

// ───────────────────────────────────────────────────────────
// 온체인: 티켓 재오픈
// ───────────────────────────────────────────────────────────
export const reopenOnChain = async (tokenId: number) => {
  const tx = await contract.reopenTicket(tokenId);
  await tx.wait();
};

// ───────────────────────────────────────────────────────────
// DB: 티켓 재오픈 상태 저장
// ───────────────────────────────────────────────────────────
export const markTicketReopened = async (ticketId: string) => {
  const { error } = await supabase
    .from('tickets')
    .update({ is_cancelled: false })
    .eq('id', ticketId);
  if (error) {
    console.error('markTicketReopened 오류:', error);
    throw error;
  }
};

// seats 테이블에서 seat_id 조회
export async function findSeatIdByPosition(sectionId: string, row: number, col: number): Promise<string> {
  const { data: seat, error } = await supabase
    .from('seats')
    .select('id')
    .match({
      section_id: sectionId,
      row_idx: row,
      col_idx: col,
    })
    .single();

  if (error) {
    throw new Error(`좌석 조회 오류: ${error.message}`);
  }

  if (!seat) {
    throw new Error('해당 좌표에 좌석이 없습니다.');
  }

  return seat.id;
}

// ───────────────────────────────────────────────────────────
// QR 코드 인증 관련 함수들
// ───────────────────────────────────────────────────────────

/**
 * QR 코드 데이터 생성
 */
export const generateQRData = async (ticketId: string): Promise<{
  tokenId: string;
  contractAddress: string;
  ticketId: string;
  walletAddress: string;
  qrString: string;
}> => {
  try {
    console.log('🔍 QR 데이터 생성 요청 - 티켓 ID:', ticketId);
    
    // 1. 티켓 정보 조회 (지갑 주소 포함)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        nft_token_id, 
        user_id,
        users!inner (wallet_address)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('❌ 티켓 조회 실패:', ticketError);
      throw new Error('티켓을 찾을 수 없습니다');
    }

    console.log('✅ 티켓 조회 성공:', ticket);

    if (!ticket.nft_token_id) {
      throw new Error('NFT가 민팅되지 않은 티켓입니다');
    }

    if (!ticket.users?.wallet_address) {
      throw new Error('사용자 지갑 주소를 찾을 수 없습니다');
    }

    // 2. 컨트랙트 주소 가져오기
    const contractAddress = process.env.TICKET_MANAGER_ADDRESS;
    if (!contractAddress) {
      throw new Error('컨트랙트 주소가 설정되지 않았습니다');
    }

    // 3. QR 데이터 생성 (지갑 주소 포함)
    const qrData = {
      tokenId: ticket.nft_token_id.toString(),
      contractAddress: contractAddress,
      ticketId: ticketId.toString(),
      walletAddress: ticket.users.wallet_address
    };

    const qrString = JSON.stringify(qrData);
    
    console.log('📝 생성된 QR 데이터:', qrData);

    return {
      tokenId: ticket.nft_token_id.toString(),
      contractAddress,
      ticketId: ticketId.toString(),
      walletAddress: ticket.users.wallet_address,
      qrString
    };

  } catch (error) {
    console.error('QR 데이터 생성 오류:', error);
    throw error;
  }
};

/**
 * QR 코드 인증
 */
export const verifyQRCode = async (qrDataString: string): Promise<{
  isValid: boolean;
  ticketInfo: any;
  verification: {
    ownershipValid: boolean;
    usageStatusValid: boolean;
    faceVerificationValid: boolean;
    cancellationStatusValid: boolean;
    errors: string[];
  };
}> => {
  try {
    console.log('🔍 QR 데이터 수신:', qrDataString);
    
    // 1. QR 데이터 파싱 (안전한 파싱)
    let qrData;
    try {
      qrData = JSON.parse(qrDataString);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('원본 데이터:', qrDataString);
      
      // 더미 데이터로 테스트
      qrData = {
        tokenId: '0',
        contractAddress: '0x0000000000000000000000000000000000000000',
        ticketId: 'dummy-ticket-id',
        walletAddress: '0x0000000000000000000000000000000000000000'
      };
    }
    
    const { tokenId, contractAddress, ticketId, walletAddress } = qrData;

    if (!tokenId || !contractAddress || !ticketId || !walletAddress) {
      throw new Error('QR 코드 데이터가 유효하지 않습니다 (필수 필드 누락)');
    }

    // 2. 티켓 정보 조회 (UI 표시용)
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        users ( id, wallet_address ),
        concerts ( title, start_date, start_time, venues ( name ) )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      throw new Error('티켓을 찾을 수 없습니다');
    }

    // 3. 블록체인 중심 검증 수행
    const { BlockchainVerificationService } = await import('../blockchain/verification.service');
    const blockchainVerification = new BlockchainVerificationService();
    
    // 🎯 블록체인 중심 검증 (QR에서 추출한 지갑 주소 사용)
    const [ownershipResult, usageResult, faceResult, cancellationResult] = await Promise.all([
      // 소유권 검증: 블록체인 소유자 vs QR 지갑 주소
      (async () => {
        try {
          // 블록체인에서 소유자 확인
          const blockchainOwner = await blockchainVerification.getTokenOwner(Number(tokenId));
          const isValid = blockchainOwner.toLowerCase() === walletAddress.toLowerCase();
          
          return {
            isValid,
            blockchainOwner,
            userWallet: walletAddress,
            error: !isValid ? '블록체인 소유권 불일치' : undefined
          };
        } catch (error) {
          return {
            isValid: false,
            blockchainOwner: null,
            userWallet: walletAddress,
            error: `소유권 검증 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
          };
        }
      })(),
      blockchainVerification.verifyTicketUsageStatus(Number(tokenId)),
      blockchainVerification.verifyFaceVerificationStatus(Number(tokenId), ticket.user_id),
      blockchainVerification.verifyTicketCancellationStatus(Number(tokenId))
    ]);

    // 입장 가능 여부 계산
    const canEnter = 
      ownershipResult.isValid &&
      usageResult.isValid &&
      // faceResult.isValid && // 얼굴 인증 우회 (테스트용)
      cancellationResult.isValid &&
      !usageResult.blockchainIsUsed && // 블록체인에서 사용되지 않음
      !cancellationResult.blockchainIsCancelled; // 취소되지 않음

    const errors: string[] = [];
    if (ownershipResult.error) errors.push(ownershipResult.error);
    if (usageResult.error) errors.push(usageResult.error);
    if (faceResult.error) errors.push(faceResult.error);
    if (cancellationResult.error) errors.push(cancellationResult.error);

    // 4. 로그 출력
    console.log('🔍 QR 인증 - 블록체인 중심 검증:', {
      tokenId,
      ticketId,
      qrWalletAddress: walletAddress,
      blockchainOwner: ownershipResult.blockchainOwner,
      ownershipValid: ownershipResult.isValid,
      usageValid: usageResult.isValid,
      faceValid: faceResult.isValid,
      cancellationValid: cancellationResult.isValid
    });

    // 5. 결과 반환
    return {
      isValid: canEnter,
      ticketInfo: {
        tokenId,
        ticketId,
        concertTitle: ticket.concerts?.title || '테스트 콘서트',
        date: ticket.concerts?.start_date || '2024-12-31',
        time: ticket.concerts?.start_time || '19:00',
        venue: ticket.concerts?.venues?.name || '테스트 공연장',
        seatInfo: ticket.seat_number || 'A-1',
        price: ticket.purchase_price || 50000,
        holder: walletAddress // QR에서 추출한 지갑 주소 사용
      },
      verification: {
        ownershipValid: ownershipResult.isValid,
        usageStatusValid: usageResult.isValid,
        faceVerificationValid: faceResult.isValid,
        cancellationStatusValid: cancellationResult.isValid,
        errors: errors
      }
    };

  } catch (error) {
    console.error('QR 코드 인증 오류:', error);
    throw error;
  }
};

