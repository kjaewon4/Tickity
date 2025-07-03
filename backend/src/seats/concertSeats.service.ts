// src/seats/concertSeats.service.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SeatState = 'AVAILABLE' | 'HOLD' | 'SOLD' | 'CANCELLED';

interface UpdateConcertSeatParams {
  concertId: string;
  seatId: string;
  newStatus: SeatState;
  userId?: string;
  holdExpiresAt?: string | null; // ISO string
}

export async function updateConcertSeatStatus(params: UpdateConcertSeatParams) {
  const { concertId, seatId, newStatus, userId, holdExpiresAt } = params;

  const { error } = await supabase
    .from('concert_seats')
    .update({
      current_status: newStatus,
      last_action_user: userId ?? null,
      hold_expires_at: holdExpiresAt ?? null,
    })
    .match({
      concert_id: concertId,
      seat_id: seatId,
    });

  if (error) {
    throw new Error(`좌석 상태 업데이트 실패: ${error.message}`);
  }
}
