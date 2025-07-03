import { Router, Request, Response } from 'express';
import { getAllUsers, createUser, getUserProfile, updateUserProfile } from './users.service';
import { getUserTickets } from '../tickets/tickets.service';
import { authenticateToken } from '../auth/auth.middleware';
import { ApiResponse, UserInfo } from '../types/auth';
import { decryptResidentNumber } from '../utils/encryption';
import { supabase } from '../lib/supabaseClient';

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
 * 마이페이지 전체 정보 조회 (프로필 + 티켓 + 좋아요 목록) (JWT 미들웨어 제거 - 임시)
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

    // 좋아요 목록 조회 함수
    const getUserFavorites = async (userId: string) => {
      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          concerts (
            id,
            title,
            main_performer,
            start_date,
            start_time,
            poster_url,
            category,
            venues (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('좋아요 목록 조회 오류:', error);
        return [];
      }

      return favorites || [];
    };

    // 병렬로 프로필, 티켓, 좋아요 정보 조회 (성능 최적화)
    const [userProfile, userTickets, userFavorites] = await Promise.all([
      getUserProfile(userId),
      getUserTickets(userId),
      getUserFavorites(userId)
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

    // 좋아요 통계 계산
    const favoriteStats = {
      total: userFavorites.length
    };

    res.json({
      success: true,
      data: {
        profile: userProfile,
        tickets: userTickets,
        favorites: userFavorites,
        stats: {
          tickets: ticketStats,
          favorites: favoriteStats
        }
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

/**
 * 사용자 티켓 상세 정보 조회 (챗봇 스타일 포맷팅)
 * GET /users/tickets/:userId
 */
router.get('/tickets/:userId', /* authenticateToken, */ async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const userTickets = await getUserTickets(userId);
    
    if (userTickets.length === 0) {
      return res.json({
        success: true,
        data: {
          tickets: [],
          formattedTickets: "현재 예매하신 티켓이 없습니다.",
          stats: {
            total: 0,
            used: 0,
            upcoming: 0,
            canceled: 0
          }
        },
        message: '티켓 조회 성공 (예매 내역 없음)'
      });
    }

    // 챗봇 스타일로 포맷팅된 티켓 정보 생성
    const formattedTickets = userTickets.map((ticket, index) => {
      const status = ticket.is_used ? '사용됨' : 
                    ticket.canceled_at ? '취소됨' : '예매완료';
      
      const seatInfo = ticket.seat?.label || 
                      (ticket.seat?.row_idx && ticket.seat?.col_idx ? 
                       `${ticket.seat.row_idx}열 ${ticket.seat.col_idx}번` : '좌석 정보 없음');
      
      return {
        index: index + 1,
        concertTitle: ticket.concert?.title || '콘서트 정보 없음',
        seatInfo: `${seatInfo} (${ticket.seat?.grade_name || '등급 정보 없음'})`,
        price: ticket.purchase_price.toLocaleString() + '원',
        status: status,
        purchaseDate: new Date(ticket.created_at).toLocaleDateString('ko-KR'),
        concertDate: ticket.concert?.date ? new Date(ticket.concert.date).toLocaleDateString('ko-KR') : '날짜 정보 없음',
        venueName: ticket.concert?.venue_name || '장소 정보 없음',
        raw: ticket // 원본 데이터도 포함
      };
    });

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
        tickets: userTickets, // 원본 데이터
        formattedTickets: formattedTickets, // 챗봇 스타일 포맷팅된 배열
        stats: ticketStats
      },
      message: '티켓 조회 성공'
    });
  } catch (error) {
    console.error('티켓 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '티켓 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 주민번호 7자리 조회 (복호화)
 * GET /users/resident-number/:userId
 */
router.get('/resident-number/:userId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: '사용자 ID가 필요합니다.' });
    }
    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('resident_number_encrypted')
      .eq('id', userId)
      .single();
    if (userError || !userData) {
      return res.status(404).json({ success: false, error: '사용자 정보를 찾을 수 없습니다.' });
    }
    if (!userData.resident_number_encrypted) {
      return res.status(404).json({ success: false, error: '주민번호 정보가 없습니다.' });
    }
    // 복호화
    let residentNumber;
    try {
      residentNumber = decryptResidentNumber(userData.resident_number_encrypted);
    } catch (e) {
      return res.status(500).json({ success: false, error: '주민번호 복호화에 실패했습니다.' });
    }
    return res.json({ success: true, data: { residentNumber }, message: '주민번호 조회 성공' });
  } catch (error) {
    return res.status(500).json({ success: false, error: '알 수 없는 오류가 발생했습니다.' });
  }
});

export default router; 
