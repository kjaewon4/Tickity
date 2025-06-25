import { Ticket } from './tickets.model';
import { supabase } from '../lib/supabaseClient';

// 레거시 메모리 기반 (하위 호환성)
const tickets: Ticket[] = [];

export const getAllTickets = (): Ticket[] => tickets;

export const createTicket = (ticket: Ticket): Ticket => {
  tickets.push(ticket);
  return ticket;
};

/**
 * 티켓 상세 정보를 위한 확장 인터페이스
 */
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

/**
 * 사용자 ID로 예매한 티켓 목록 조회
 * @param userId - 사용자 ID
 * @returns 사용자의 티켓 목록 (콘서트, 좌석 정보 포함)
 */
export const getUserTickets = async (userId: string): Promise<TicketWithDetails[]> => {
  try {
    const { data: ticketsData, error } = await supabase
      .from('tickets')
      .select(`
        *,
        concerts (
          id,
          title,
          date,
          location,
          poster_url
        ),
        seats (
          id,
          seat_number,
          seat_grades (
            grade_name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 티켓 조회 오류:', error);
      return [];
    }

    if (!ticketsData) {
      return [];
    }

    // 데이터 변환
    return ticketsData.map((ticket: any) => ({
      id: ticket.id,
      user_id: ticket.user_id,
      concert_id: ticket.concert_id,
      seat_id: ticket.seat_id,
      nft_token_id: ticket.nft_token_id,
      token_uri: ticket.token_uri,
      tx_hash: ticket.tx_hash,
      issued_at: ticket.issued_at,
      purchase_price: ticket.purchase_price,
      is_used: ticket.is_used,
      canceled_at: ticket.canceled_at,
      cancellation_fee: ticket.cancellation_fee,
      refund_tx_hash: ticket.refund_tx_hash,
      created_at: ticket.created_at,
      concert: ticket.concerts ? {
        id: ticket.concerts.id,
        title: ticket.concerts.title,
        date: ticket.concerts.date,
        location: ticket.concerts.location,
        poster_url: ticket.concerts.poster_url
      } : undefined,
      seat: ticket.seats ? {
        id: ticket.seats.id,
        seat_number: ticket.seats.seat_number,
        grade_name: ticket.seats.seat_grades?.grade_name || ''
      } : undefined
    }));
  } catch (error) {
    console.error('getUserTickets 오류:', error);
    return [];
  }
};

/**
 * 티켓 ID로 특정 티켓 조회
 * @param ticketId - 티켓 ID
 * @param userId - 사용자 ID (권한 확인용)
 * @returns 티켓 정보
 */
export const getTicketById = async (
  ticketId: string, 
  userId: string
): Promise<TicketWithDetails | null> => {
  try {
    const { data: ticketData, error } = await supabase
      .from('tickets')
      .select(`
        *,
        concerts (
          id,
          title,
          date,
          location,
          poster_url
        ),
        seats (
          id,
          seat_number,
          seat_grades (
            grade_name
          )
        )
      `)
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('티켓 조회 오류:', error);
      return null;
    }

    if (!ticketData) {
      return null;
    }

    return {
      id: ticketData.id,
      user_id: ticketData.user_id,
      concert_id: ticketData.concert_id,
      seat_id: ticketData.seat_id,
      nft_token_id: ticketData.nft_token_id,
      token_uri: ticketData.token_uri,
      tx_hash: ticketData.tx_hash,
      issued_at: ticketData.issued_at,
      purchase_price: ticketData.purchase_price,
      is_used: ticketData.is_used,
      canceled_at: ticketData.canceled_at,
      cancellation_fee: ticketData.cancellation_fee,
      refund_tx_hash: ticketData.refund_tx_hash,
      created_at: ticketData.created_at,
      concert: ticketData.concerts ? {
        id: ticketData.concerts.id,
        title: ticketData.concerts.title,
        date: ticketData.concerts.date,
        location: ticketData.concerts.location,
        poster_url: ticketData.concerts.poster_url
      } : undefined,
      seat: ticketData.seats ? {
        id: ticketData.seats.id,
        seat_number: ticketData.seats.seat_number,
        grade_name: ticketData.seats.seat_grades?.grade_name || ''
      } : undefined
    };
  } catch (error) {
    console.error('getTicketById 오류:', error);
    return null;
  }
}; 