// src/tickets/tickets.controller.ts
import { Router, Request, Response } from 'express';
<<<<<<< backup-my-work
import * as ticketsService from './tickets.service';
=======
import { getUserTickets } from './tickets.service';
>>>>>>> main
import { ApiResponse } from '../types/auth';

const router = Router();

<<<<<<< backup-my-work
/**
 * 전체 티켓 조회
 * GET /tickets
 */
router.get(
  '/',
  async (_req: Request, res: Response<ApiResponse & { data?: any[] }>) => {
    try {
      const tickets = await ticketsService.getAllTickets();
      res.json({ success: true, data: tickets });
    } catch (err) {
      console.error('전체 티켓 조회 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 조회 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 티켓 발급(예매)
 * POST /tickets
 */
router.post(
  '/',
  async (req: Request, res: Response<ApiResponse & { data?: any }>) => {
    try {
      const ticket = await ticketsService.createTicket(req.body);
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      console.error('티켓 생성 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 생성 중 오류가 발생했습니다.' });
    }
  }
);

=======
>>>>>>> main
/**
 * 사용자별 예매 티켓 목록 조회
 * GET /tickets/my-tickets/:userId
 */
router.get(
  '/my-tickets/:userId',
  async (
    req: Request,
    res: Response<ApiResponse & { data?: { tickets: any[]; total: number } }>
  ) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, error: '사용자 ID가 필요합니다.' });
      }

      const userTickets = await ticketsService.getUserTickets(userId);
      res.json({
        success: true,
        data: { tickets: userTickets, total: userTickets.length },
      });
    } catch (err) {
      console.error('사용자 티켓 조회 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 목록 조회 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 티켓 취소
 * POST /tickets/cancel
 */
router.post(
  '/cancel',
  async (
    req: Request,
    res: Response<ApiResponse & { data?: { reopenTime: number } }>
  ) => {
    try {
      const { seatId, ticketId, tokenId } = req.body;
      if (!seatId || !ticketId || tokenId == null) {
        return res
          .status(400)
          .json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
      }

      // 1) DB: 좌석 예약 해제
      await ticketsService.setSeatReserved(seatId, false);
      // 2) on-chain: cancelTicket 호출 → reopenTime 반환
      const reopenTime = await ticketsService.cancelOnChain(
        Number(tokenId)
      );
      // 3) DB: 티켓 취소 정보 저장
      await ticketsService.markTicketCancelled(ticketId, reopenTime);

      res.json({ success: true, data: { reopenTime } });
    } catch (err) {
      console.error('티켓 취소 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 취소 처리 중 오류가 발생했습니다.' });
    }
  }
);

export default router;
