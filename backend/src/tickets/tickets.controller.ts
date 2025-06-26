import { Router, Request, Response } from 'express';
import { getAllTickets, createTicket, getUserTickets } from './tickets.service';
import { ApiResponse } from '../types/auth';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllTickets());
});

router.post('/', (req, res) => {
  const ticket = createTicket(req.body);
  res.status(201).json(ticket);
});

/**
 * 사용자 예매 티켓 목록 조회 (JWT 미들웨어 제거 - 임시)
 * GET /users/my-tickets/:userId
 */
router.get('/my-tickets/:userId', /* authenticateToken, */ async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const userTickets = await getUserTickets(userId);

    res.json({
      success: true,
      data: {
        tickets: userTickets,
        total: userTickets.length
      },
      message: '티켓 목록 조회 성공'
    });
  } catch (error) {
    console.error('티켓 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '티켓 목록 조회 중 오류가 발생했습니다.'
    });
  }
});


export default router; 