// src/schedulers/reopen.scheduler.ts
import cron from "node-cron";
import { Op } from "sequelize";
import { Ticket } from "../tickets/tickets.model";
import { reopenOnChain, markTicketReopened } from "../tickets/tickets.service";

export function startReopenScheduler() {
  // 매 분마다 실행
  cron.schedule("*/1 * * * *", async () => {
    const now = Math.floor(Date.now() / 1000);
    try {
      // 취소 상태이면서 reopen_time이 지났거나 같은 티켓들
      const expired = await Ticket.findAll({
        where: {
          is_cancelled: true,
          reopen_time:  { [Op.lte]: now },
        },
      });
      if (!expired.length) return;

      for (const tk of expired) {
        const tokenId = Number(tk.nft_token_id);
        try {
          await reopenOnChain(tokenId);
          await markTicketReopened(tk.id);
          console.log(`✅ 티켓 ${tk.id} (tokenId=${tokenId}) 재오픈 완료`);
        } catch (e) {
          console.error(`❌ 티켓 ${tk.id} 재오픈 에러:`, e);
        }
      }
    } catch (e) {
      console.error("Scheduler error:", e);
    }
  });
}
