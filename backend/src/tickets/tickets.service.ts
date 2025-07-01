// backend/src/tickets/tickets.service.ts

import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../lib/supabaseClient';
import { Ticket } from './tickets.model';
import { ethers, Contract, Wallet } from 'ethers';
// artifacts 폴더 내 생성된 JSON ABI 파일을 가져옵니다.
// tickets.service.ts 기준으로 ../../../blockchain/artifacts/... 경로
import TicketJSON from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';

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

// ───────────────────────────────────────────────────────────
// 확장된 티켓 타입 (콘서트·좌석 정보 포함)
// ───────────────────────────────────────────────────────────
export interface TicketWithDetails extends Ticket {
  concert?: {
    id: string;
    title: string;
    date: string;
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
export const createTicket = async (
  payload: Omit<Ticket, 'id' | 'created_at'>
): Promise<Ticket> => {
  // issued_at이 없으면 현재 시간으로 설정
  const ticketData = {
    ...payload,
    issued_at: payload.issued_at || new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert([ticketData]);

  if (error) {
    console.error('createTicket 오류:', error);
    throw error;
  }

  // insert 후 select로 다시 조회
  const { data: inserted, error: selectError } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (selectError) {
    console.error('createTicket select 오류:', selectError);
    throw selectError;
  }

  return inserted as Ticket;
};

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
        date, 
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
      date:       t.concerts.date,
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
        date, 
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
      date:       data.concerts.date,
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
