import { Router, Request, Response } from 'express';
import { getAllUsers, createUser, getUserProfile, updateUserProfile } from './users.service';
import { getUserTickets } from '../tickets/tickets.service';
import { authenticateToken } from '../auth/auth.middleware';
import { ApiResponse, UserInfo } from '../types/auth';

const router = Router();

// 기존 엔드포인트들 (레거시)
router.get('/', (req: Request, res: Response) => {
  res.json(getAllUsers());
});

router.post('/', (req: Request, res: Response) => {
  const user = createUser(req.body);
  res.status(201).json(user);
});

// =================
// 사용자 프로필 기능
// =================

/**
 * 사용자 프로필 조회
 * GET /users/profile/:userId
 */
router.get('/profile/:userId', async (req: Request, res: Response<ApiResponse<UserInfo>>) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: userProfile,
      message: '프로필 조회 성공'
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 프로필 수정 (JWT 미들웨어 제거 - 임시)
 * PUT /users/profile/:userId
 */
router.put('/profile/:userId', /* authenticateToken, */ async (req: Request, res: Response<ApiResponse<UserInfo>>) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const { name, walletAddress } = req.body;

    // 입력 검증
    if (!name && walletAddress === undefined) {
      return res.status(400).json({
        success: false,
        error: '수정할 정보를 입력해주세요.'
      });
    }

    const updatedProfile = await updateUserProfile(userId, {
      name,
      walletAddress
    });

    if (!updatedProfile) {
      return res.status(500).json({
        success: false,
        error: '프로필 수정에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      data: updatedProfile,
      message: '프로필 수정 성공'
    });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '프로필 수정 중 오류가 발생했습니다.'
    });
  }
});

// =================
// 마이페이지 대시보드 (통합 정보)
// =================

/**
 * 마이페이지 전체 정보 조회 (프로필 + 티켓) (JWT 미들웨어 제거 - 임시)
 * GET /users/dashboard/:userId
 */
router.get('/dashboard/:userId', /* authenticateToken, */ async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    // 병렬로 프로필과 티켓 정보 조회 (성능 최적화)
    const [userProfile, userTickets] = await Promise.all([
      getUserProfile(userId),
      getUserTickets(userId)
    ]);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // 티켓 통계 계산
    const ticketStats = {
      total: userTickets.length,
      used: userTickets.filter(ticket => ticket.is_used).length,
      upcoming: userTickets.filter(ticket => 
        !ticket.is_used && 
        !ticket.canceled_at && 
        new Date(ticket.concert?.date || '') > new Date()
      ).length,
      canceled: userTickets.filter(ticket => ticket.canceled_at).length
    };

    res.json({
      success: true,
      data: {
        profile: userProfile,
        tickets: userTickets,
        stats: ticketStats
      },
      message: '대시보드 조회 성공'
    });
  } catch (error) {
    console.error('대시보드 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '대시보드 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router; 
