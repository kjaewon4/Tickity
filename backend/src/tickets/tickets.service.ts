// backend/src/tickets/tickets.service.ts

import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../lib/supabaseClient';
import { Ticket } from './tickets.model';
import { ethers } from 'ethers';
// artifacts 폴더 내 생성된 JSON ABI 파일을 가져옵니다.
// tickets.service.ts 기준으로 ../../../blockchain/artifacts/... 경로
import TicketJSON from '../../../blockchain/artifacts/contracts/SoulboundTicket.sol/SoulboundTicket.json';

// .deployed 파일(.deployed)에 기록된 환경변수도 불러오려면 이렇게
dotenv.config({ path: path.resolve(__dirname, '../../../blockchain/.deployed') });
// 그리고 .env 파일도
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TICKET_MANAGER_ADDRESS = process.env.TICKET_MANAGER_ADDRESS!;
if (!TICKET_MANAGER_ADDRESS) {
  throw new Error('.deployed 또는 .env 에 TICKET_MANAGER_ADDRESS가 설정되어 있지 않습니다');
}

// ───────────────────────────────────────────────────────────
// on‐chain 연결 설정
// ───────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const admin    = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

// ABI + Contract 주소로 ethers.js Contract 인스턴스 생성
const contract = new ethers.Contract(
  TICKET_MANAGER_ADDRESS,
  TicketJSON.abi as any,
  admin
);

// ───────────────────────────────────────────────────────────
// 확장된 티켓 타입 (콘서트·좌석 정보 포함)
// ───────────────────────────────────────────────────────────
export interface TicketWithDetails extends Ticket {
  concert?: {
    id: string;
    title: string;
    date: string;
    location: string;
    poster_url?: string;
  };
  seat?: {
    id: string;
    seat_number: string;
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
      concerts ( id, title, date, location, poster_url ),
      seats    ( id, seat_number, seat_grades ( grade_name ) )
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
      location:   t.concerts.location,
      poster_url: t.concerts.poster_url,
    },
    seat: t.seats && {
      id:          t.seats.id,
      seat_number: t.seats.seat_number,
      grade_name:  t.seats.seat_grades?.grade_name || ''
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
      concerts ( id, title, date, location, poster_url ),
      seats    ( id, seat_number, seat_grades ( grade_name ) )
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
      location:   data.concerts.location,
      poster_url: data.concerts.poster_url,
    },
    seat: data.seats && {
      id:          data.seats.id,
      seat_number: data.seats.seat_number,
      grade_name:  data.seats.seat_grades?.grade_name || ''
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
    .from('seats')
    .update({ is_reserved: reserved })
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
  const tx = await contract.cancelTicket(tokenId);
  const receipt = await tx.wait();
  const evt = receipt.events?.find((e: any) => e.event === 'TicketCancelled');
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
  if (!contract) {
    throw new Error('블록체인 연결이 설정되지 않았습니다.');
  }
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
