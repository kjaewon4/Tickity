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
import { SoulboundTicket__factory } from '../../../blockchain/typechain';

// 로컬 체인 배포 주소 등 불러올 .deployed
dotenv.config({ path: path.resolve(__dirname, '../../../blockchain/.deployed') });
// .env 불러오기
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL    = process.env.RPC_URL!;
const ADMIN_KEY  = process.env.ADMIN_PRIVATE_KEY!;
const CONTRACT   = process.env.TICKET_MANAGER_ADDRESS!;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const admin    = new ethers.Wallet(ADMIN_KEY, provider);
// TypeChain 팩토리를 사용하여 컨트랙트 인스턴스 생성
const contract = SoulboundTicket__factory.connect(CONTRACT, admin);
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

// 취소 정책 데이터의 타입 정의 (Supabase 응답에 따라 조정)
interface CancellationPolicy {
  id: string; // uuid
  period_desc: string; // 예: "관람일 10일전까지", "관람일 2일전~1일전까지"
  fee_desc: string; // 예: "없음", "티켓금액의 30%"
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
  // FK 사전 검증: user_id, concert_id, seat_id 모두 존재해야 함
  const [{ data: user, error: userErr }, { data: concert, error: concertErr }, { data: seat, error: seatErr }] = await Promise.all([
    supabase.from('users').select('id').eq('id', payload.user_id).maybeSingle(),
    supabase.from('concerts').select('id').eq('id', payload.concert_id).maybeSingle(),
    supabase.from('seats').select('id').eq('id', payload.seat_id).maybeSingle(),
  ]);
  if (userErr || !user) throw new Error('티켓 생성 실패: 유효하지 않은 사용자입니다.');
  if (concertErr || !concert) throw new Error('티켓 생성 실패: 유효하지 않은 콘서트입니다.');
  if (seatErr || !seat) throw new Error('티켓 생성 실패: 유효하지 않은 좌석입니다.');

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
    tokenId: string,
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
      seats ( id, row_idx, col_idx, seat_grades ( grade_name ) )
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
): Promise<any[]> => {
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

      const tokenId = Number(ticket.nft_token_id);

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

  return ticketsWithVerification as any[];
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
      seats ( id, row_idx, col_idx, seat_grades ( grade_name ) )
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
    .update({ current_status: reserved ? 'SOLD' : 'AVAILABLE' })
    .eq('seat_id', seatId);

  if (error) {
    console.error('setSeatReserved 오류:', error);
    throw error;  
  }
};

// ───────────────────────────────────────────────────────────
// 온체인: 티켓 취소 → 재오픈 시간 반환
// ───────────────────────────────────────────────────────────
export const cancelOnChain = async (tokenId: number,   refundedAmountWon: number // 백엔드에서 계산된 원화 환불 금액
): Promise<{ reopenTime: number; transactionHash: string }> => {
  console.log(`[cancelOnChain] Attempting to cancel ticket with tokenId: ${tokenId}`);
  
  // 원화 환불 금액을 ETH로 변환 (string)
  const refundedEthString = convertWonToEth(refundedAmountWon);
  // ETH 문자열을 Wei (BigInt)로 변환하여 컨트랙트에 전달
  const refundedEthWei = ethers.parseEther(refundedEthString); // <--- Wei로 변환

  try {
    // tokenId를 BigInt로 변환하여 전달
    const tokenIdBigInt = BigInt(tokenId);
    const tx = await contract.cancelTicket(tokenIdBigInt, refundedEthWei);
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
    
    // parseLog null 체크 추가
    for (const log of receipt.logs as Log[]) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'TicketCancelled') { // null 체크 추가
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

// DB에서 티켓 정보 및 콘서트 날짜를 조회하는 헬퍼 함수 (재사용 가능성 있음)
export const getTicketAndConcertInfo = async (ticketId: string) => {
    const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
            purchase_price,
            concerts (
                start_date
            )
        `)
        .eq('id', ticketId)
        .single();

    if (ticketError || !ticketData) {
        throw new Error(`티켓 정보 조회 오류: ${ticketError?.message || '정보 없음'}`);
    }
    return {
        originalPriceWon: Number(ticketData.purchase_price),
        concertStartDate: ticketData.concerts?.start_date
    };
};



// 현재 ETH 가격을 가져오는 함수 (실제 구현에서는 외부 API 연동)
export const getCurrentEthPriceWon = async (): Promise<number> => {
    // 실제로는 여기에 CoinGecko, Upbit 등의 API를 호출하여 최신 ETH/KRW 가격을 가져오는 로직 구현
    // 예시:
    return 4_000_000; // 1 ETH = 400만원 (임시 값)
};

// 취소 정책을 기반으로 수수료율을 가져오는 함수
export const getCancellationPolicy = async (daysUntilConcert: number): Promise<number> => {
  const { data, error } = await supabase
    .from('cancellation_policies')
    .select('period_desc, fee_desc')
    // 중요: DB에서 가져온 정책들을 daysUntilConcert와 비교하기 쉬운 순서로 정렬해야 합니다.
    // 예를 들어, 남은 일수가 많은 것부터 적은 것 순으로 정렬하면 if-else if 로직이 더 단순해집니다.
    // 현재 `period_desc`가 문자열이라 직접 정렬이 어려울 수 있으므로,
    // 가능하다면 DB에 `min_days`, `max_days` 컬럼을 추가하고 그 기준으로 정렬하는 것을 권장합니다.
    // 여기서는 일단 'period_desc'로 정렬한 후 코드 내부에서 처리합니다.
    // (만약 '관람일 10일전까지'가 가장 긴 기간이고 수수료가 없다면, 그게 먼저 체크되어야 합니다.)
    .order('period_desc', { ascending: true }); // 문자열 정렬이므로 실제 의미와 다를 수 있음. 수동 정렬 필요 시 유의.

  if (error) {
    console.error('getCancellationPolicy 오류:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('취소 정책 데이터가 DB에 없습니다. 기본 수수료 0% 적용.');
    return 0;
  }

  let feePercentage = 0; // 기본 수수료 0%

  // DB에서 가져온 정책들을 유효한 날짜 범위로 변환하여 저장할 배열
  const parsedPolicies: { min: number; max: number; fee: number }[] = [];

  for (const policy of data as CancellationPolicy[]) {
    const { period_desc, fee_desc } = policy;
    let minDays: number | null = null;
    let maxDays: number | null = null;
    let fee = 0;

    // 'period_desc' 문자열 파싱
    const matchesUntil = period_desc.match(/관람일 (\d+)일전까지/);
    const matchesRange = period_desc.match(/관람일 (\d+)일전~(\d+)일전까지/);

    if (matchesUntil) {
      minDays = parseInt(matchesUntil[1], 10);
      maxDays = Infinity; // "N일전까지"는 N일 이상 남은 경우
    } else if (matchesRange) {
      // "관람일 X일전~Y일전까지"에서 X는 더 먼 날짜(큰 숫자), Y는 더 가까운 날짜(작은 숫자)
      maxDays = parseInt(matchesRange[1], 10); // 예를 들어 9일전
      minDays = parseInt(matchesRange[2], 10); // 예를 들어 7일전
    } else if (period_desc === "없음") {
      minDays = 0; // 모든 기간에 해당
      maxDays = Infinity;
    }
    // 다른 패턴이 있다면 여기에 추가

    // 'fee_desc' 문자열 파싱
    const feeMatch = fee_desc.match(/(\d+)%/); // "티켓금액의 N%" 패턴
    if (fee_desc === "없음") {
      fee = 0;
    } else if (feeMatch) {
      fee = parseFloat(feeMatch[1]) / 100; // N%를 0.N 형태로 변환
    }

    if (minDays !== null && maxDays !== null) {
      parsedPolicies.push({ min: minDays, max: maxDays, fee: fee });
    }
  }

  // 파싱된 정책들을 `daysUntilConcert`에 맞춰 순회하며 정확한 수수료를 찾습니다.
  // **가장 중요한 부분: 정책 적용 순서.**
  // 일반적으로 남은 일수가 많은 (수수료가 낮은) 정책부터 체크하거나
  // 남은 일수가 적은 (수수료가 높은) 정책부터 체크하여 먼저 일치하는 것을 적용합니다.
  // 현재 DB 이미지와 "관람일 10일전까지" (없음), "관람일 9일~7일전까지" (10%),
  // "관람일 6일~3일전까지" (20%), "관람일 2일전~1일전까지" (30%) 순서를 보면,
  // 남은 일수가 많을수록 수수료가 낮으므로, `min` 값이 큰 순서(내림차순)로 정렬하여 처리하는 것이 논리적입니다.
  parsedPolicies.sort((a, b) => b.min - a.min); // minDays가 큰 순서 (더 먼 날짜)부터 정렬

  for (const policy of parsedPolicies) {
    if (daysUntilConcert >= policy.min) { // daysUntilConcert가 해당 정책의 최소 일수 이상인 경우 (최대 일수까지)
      // "관람일 10일전까지" (min=10, max=Infinity) -> daysUntilConcert >= 10
      // "관람일 9일~7일전까지" (min=7, max=9) -> daysUntilConcert >= 7 && daysUntilConcert <= 9
      // 현재 `period_desc` 패턴에서 `matchesRange`는 `maxDays`가 더 큰 숫자, `minDays`가 더 작은 숫자이므로
      // `daysUntilConcert >= policy.min && (policy.max === Infinity || daysUntilConcert <= policy.max)`
      if (policy.max === Infinity || daysUntilConcert <= policy.max) {
        feePercentage = policy.fee;
        break; // 적합한 정책을 찾았으므로 루프 종료
      }
    }
  }
  
  return feePercentage;
};

// 환불 금액 (원화)을 계산하는 핵심 함수
export const calculateRefundAmountWon = async (ticketId: string): Promise<{ originalPriceWon: number; cancellationFeeWon: number; refundedAmountWon: number }> => {
    // 1. DB에서 티켓 구매 가격과 콘서트 시작 날짜 조회
    const { originalPriceWon, concertStartDate } = await getTicketAndConcertInfo(ticketId);

    if (!originalPriceWon || !concertStartDate) {
        throw new Error('티켓 가격 또는 콘서트 날짜 정보가 부족하여 환불 금액을 계산할 수 없습니다.');
    }

    // 2. 현재 날짜와 콘서트 시작 날짜 간의 차이 (남은 일수) 계산
    const concertDate = new Date(concertStartDate); // 콘서트 시작일 Date 객체
    const today = new Date();                     // 오늘 날짜 Date 객체

    // 날짜 계산의 정확성을 위해 시/분/초를 0으로 설정하여 일(day) 단위로만 비교
    concertDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(concertDate.getTime() - today.getTime()); // 밀리초 단위 차이
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));      // 일 단위 차이 (올림)
    
    console.log(`[calculateRefundAmountWon] 콘서트까지 남은 일수: ${diffDays}일`);

    // 3. 남은 일수를 기반으로 취소 수수료 비율 가져오기
    const feePercentage = await getCancellationPolicy(diffDays);
    console.log(`[calculateRefundAmountWon] 적용된 취소 수수료 비율: ${feePercentage * 100}%`);

    // 4. 최종 환불 금액 계산
    const cancellationFeeWon = originalPriceWon * feePercentage;
    const refundedAmountWon = originalPriceWon - cancellationFeeWon;
    
    console.log(`[calculateRefundAmountWon] 원본 가격: ${originalPriceWon}원`);
    console.log(`[calculateRefundAmountWon] 취소 수수료: ${cancellationFeeWon}원`);
    console.log(`[calculateRefundAmountWon] 최종 환불 금액: ${refundedAmountWon}원`);

    return { originalPriceWon, cancellationFeeWon, refundedAmountWon };
};

/**
 * 원화를 ETH로 변환합니다. (toFixed로 지수 표기 방지)
 * @param priceWon 원화 금액
 * @returns ETH 금액 (소수점 6자리 string)
 */
export const convertWonToEth = (priceWon: number): string => {
  // 실제로는 여기에 CoinGecko, Upbit 등의 API를 호출하여 최신 ETH/KRW 가격을 가져오는 로직 구현
  // 예시: 1 ETH = 4,000,000원 기준
  const ethPerWon = 1 / 4_000_000;
  const ethAmount = (priceWon * ethPerWon).toFixed(6);
  console.log(`[convertWonToEth] ${priceWon}원 -> ${ethAmount} ETH`);
  return ethAmount;
};

// ───────────────────────────────────────────────────────────
// DB: 티켓 취소 정보 저장
// ───────────────────────────────────────────────────────────
export const markTicketCancelled = async (
  ticketId: string,
  reopenTime: number,
  refundTxHash: string | null,
  cancellationFeeWon: any, 
  refundedAmount: any
) => {
  const { error } = await supabase
    .from('tickets')
    .update({
      canceled_at:      new Date(),
      cancellation_fee: cancellationFeeWon,
      refund_tx_hash:   refundTxHash,
      is_cancelled:     true,
      reopen_time:      reopenTime,
      refunded_amount: refundedAmount
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
// src/tickets/tickets.service.ts
export const markTicketReopened = async (concertId: string, seatId: string) => {
  console.log(`[markTicketReopened] Trying to update concertId: ${concertId}, seatId: ${seatId}`);
    const { data: updatedData, error: updateError } = await supabase
        .from('concert_seats')
        .update({
            current_status: 'AVAILABLE',
            last_action_user: null,
        })
        .eq('concert_id', concertId)
        .eq('seat_id', seatId)
        .select(); // 이 부분이 중요: 업데이트된 레코드를 반환하도록 요청

    if (updateError) {
        console.error('markTicketReopened - UPDATE 오류:', updateError);
        throw updateError;
    }

    console.log('DB: 티켓 재오픈 상태 저장 - 업데이트 결과: ', updatedData); // 이 로그를 확인해야 합니다.
                                                                       // `updatedData`가 빈 배열이거나,
                                                                       // `current_status`가 여전히 `SOLD`인지 확인
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

    // users 관계 안전하게 접근
    const users = ticket.users as any;
    const userWalletAddress = Array.isArray(users) ? users[0]?.wallet_address : users?.wallet_address;
    
    if (!userWalletAddress) {
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
      walletAddress: userWalletAddress
    };

    const qrString = JSON.stringify(qrData);
    
    console.log('📝 생성된 QR 데이터:', qrData);

    return {
      tokenId: ticket.nft_token_id.toString(),
      contractAddress,
      ticketId: ticketId.toString(),
      walletAddress: userWalletAddress,
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
      throw new Error('QR 데이터 형식이 올바르지 않습니다');
    }
    
    // 2. QR 데이터 형식 호환성 처리
    let tokenId, contractAddress, ticketId, walletAddress;
    
    if (qrData.tokenId && qrData.ticketId) {
      // 새로운 형식 또는 기존 QR 스캔 형식
      tokenId = qrData.tokenId;
      ticketId = qrData.ticketId;
      contractAddress = qrData.contractAddress || process.env.TICKET_MANAGER_ADDRESS;
      walletAddress = qrData.walletAddress || qrData.holder; // holder 필드를 walletAddress로 사용
      
      console.log('🔄 QR 데이터 형식 변환:', {
        원본_tokenId: qrData.tokenId,
        원본_holder: qrData.holder,
        변환된_walletAddress: walletAddress,
        contractAddress
      });
    } else {
      // 기존 형식
      const extracted = qrData;
      tokenId = extracted.tokenId;
      contractAddress = extracted.contractAddress;
      ticketId = extracted.ticketId;
      walletAddress = extracted.walletAddress;
    }

    if (!tokenId || !contractAddress || !ticketId || !walletAddress) {
      throw new Error(`QR 코드 데이터가 유효하지 않습니다 (필수 필드 누락): tokenId=${tokenId}, contractAddress=${contractAddress}, ticketId=${ticketId}, walletAddress=${walletAddress}`);
    }

    // 3. 티켓 정보 조회 (UI 표시용)
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

    // 4. 블록체인 중심 검증 수행
    const { BlockchainVerificationService } = await import('../blockchain/verification.service');
    const blockchainVerification = new BlockchainVerificationService();
    
    console.log('🔍 QR 검증 시작:', { tokenId, ticketId, walletAddress });
    
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

    // 5. 로그 출력
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

    // 6. 결과 반환
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

