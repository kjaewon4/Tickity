// src/schedulers/reopen.scheduler.ts
import cron from 'node-cron'
import { supabase } from '../lib/supabaseClient'
import { reopenOnChain, markTicketReopened } from '../tickets/tickets.service'

/**
 * 실제 재오픈 로직: is_cancelled=true 이고 reopen_time <= now 인 티켓을 찾아
 * on‐chain reopen, DB 업데이트를 호출
 */
export async function runReopenJob(): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  // 1) 재오픈 대상 티켓 조회
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, nft_token_id, seat_id, concert_id')
    .eq('is_cancelled', true)
    .lte('reopen_time', now)

  if (error) throw error

  for (const t of tickets || []) {
    const tokenId = parseInt(t.nft_token_id, 10)
    try {
      // await reopenOnChain(tokenId)

      const cleanedConcertId = t.concert_id.trim();
      const cleanedSeatId = t.seat_id.trim();

      // SupabaseDB 업데이트 (좌석 상태 AVAILABLE로)
      await markTicketReopened(cleanedConcertId, cleanedSeatId);
      console.log(`✅ 좌석 [${t.concert_id}] ${t.seat_id} 재오픈 완료 (티켓 ID: ${t.id})`);

    } catch (e) {
      console.error(`reopen failed for ${t.id}`, e)
    }
  }
}

/**
 * cron 으로 매 분(runEveryMinute)마다 runReopenJob 호출
 */
export function startReopenScheduler(): void {
  // 예: 매 분마다 실행
  cron.schedule('* * * * *', () => {
    runReopenJob().catch(console.error)
  })
}
