// backend/src/tickets/tickets.service.ts

import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../lib/supabaseClient';
import { Ticket } from './tickets.model';
import { ethers, Contract, Wallet } from 'ethers';
// artifacts 폴더 내 생성된 JSON ABI 파일을 가져옵니다.
// tickets.service.ts 기준으로 ../../../blockchain/artifacts/... 경로
import TicketJSON from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';
import { BlockchainService } from '../blockchain/blockchain.service';
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
// 사용자별 예매 티켓 목록 조회
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
    .update({ current_status: reserved ? 'reserved' : 'available' })
    .eq('id', seatId);

  if (error) {
    console.error('setSeatReserved 오류:', error);
    throw error;
  }
};

// ───────────────────────────────────────────────────────────
// 온체인: 티켓 취소 → 재오픈 시간 반환
// ───────────────────────────────────────────────────────────
export const cancelOnChain = async (tokenId: number): Promise<number> => {
  const tx      = await contract.cancelTicket(tokenId);
  const receipt = await tx.wait();
  const evt     = receipt.events?.find((e: any) => e.event === 'TicketCancelled');
  return evt!.args!.reopenTime.toNumber();
};

// ───────────────────────────────────────────────────────────
// DB: 티켓 취소 정보 저장
// ───────────────────────────────────────────────────────────
export const markTicketCancelled = async (
  ticketId: string,
  reopenTime: number
) => {
  const { error } = await supabase
    .from('tickets')
    .update({
      canceled_at:      new Date(),
      cancellation_fee: 0,
      refund_tx_hash:   null,
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

