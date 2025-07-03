import cron from 'node-cron';
import { supabase } from '../lib/supabaseClient';

/**
 * 좌석 선택 완료 이후 10분 이내 결제가 완료되지 않을 시 선택한 좌석의 선점 기회를 잃게 함
concert_seats 테이블에서
current_status = 'HOLD'
hold_expires_at < NOW()
인 좌석을 주기적으로 AVAILABLE로 복구
 */ 

export const scheduleReleaseExpiredSeats = () => {
  cron.schedule('*/1 * * * *', async () => {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('concert_seats')
      .update({
        current_status: 'AVAILABLE',
        hold_expires_at: null,
        last_action_user: null,
      })
      .lt('hold_expires_at', now)
      .eq('current_status', 'HOLD');

    if (error) {
      console.error('[cron] 만료된 HOLD 좌석 해제 실패:', error.message);
    } else {
      console.log('[cron] 만료된 좌석 자동 해제 완료');
    }
  });
};
