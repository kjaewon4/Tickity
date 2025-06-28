import { Router, Request, Response } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { ApiResponse } from '../types/auth';
import { CreateUserFavoriteRequest } from './user_favorites.model';
import { 
  addToFavorites, 
  removeFromFavorites, 
  getUserFavorites, 
  checkIsFavorite 
} from './user_favorites.service';

const router = Router();

// 모든 엔드포인트에 인증 미들웨어 적용
router.use(authenticateToken);

// 찜하기 추가
router.post('/', async (req: Request<{}, {}, CreateUserFavoriteRequest>, res: Response<ApiResponse>) => {
  try {
    const { concert_id } = req.body;
    const userId = req.user!.id;

    if (!concert_id) {
      return res.status(400).json({
        success: false,
        error: '공연 ID가 필요합니다.'
      });
    }

    const favorite = await addToFavorites(userId, concert_id);

    res.status(201).json({
      success: true,
      data: favorite,
      message: '공연을 찜했습니다.'
    });

  } catch (error) {
    console.error('찜하기 추가 오류:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '찜하기 추가 중 오류가 발생했습니다.'
    });
  }
});

// 찜하기 삭제
router.delete('/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.user!.id;

    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '공연 ID가 필요합니다.'
      });
    }

    await removeFromFavorites(userId, concertId);

    res.json({
      success: true,
      message: '찜하기가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('찜하기 삭제 오류:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '찜하기 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 내가 찜한 공연 목록 조회
router.get('/', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.user!.id;
    const favorites = await getUserFavorites(userId);

    res.json({
      success: true,
      data: favorites,
      message: '찜한 공연 목록을 조회했습니다.'
    });

  } catch (error) {
    console.error('찜한 공연 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '찜한 공연 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 공연 찜하기 상태 확인
router.get('/check/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.user!.id;

    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '공연 ID가 필요합니다.'
      });
    }

    const isFavorite = await checkIsFavorite(userId, concertId);

    res.json({
      success: true,
      data: { isFavorite },
      message: '찜하기 상태를 확인했습니다.'
    });

  } catch (error) {
    console.error('찜하기 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '찜하기 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

// 찜하기 토글 (추가/삭제)
router.post('/toggle/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.user!.id;

    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '공연 ID가 필요합니다.'
      });
    }

    // 현재 찜하기 상태 확인
    const isFavorite = await checkIsFavorite(userId, concertId);

    if (isFavorite) {
      // 이미 찜한 상태면 삭제
      await removeFromFavorites(userId, concertId);
      res.json({
        success: true,
        data: { isFavorite: false },
        message: '찜하기가 삭제되었습니다.'
      });
    } else {
      // 찜하지 않은 상태면 추가
      await addToFavorites(userId, concertId);
      res.json({
        success: true,
        data: { isFavorite: true },
        message: '공연을 찜했습니다.'
      });
    }

  } catch (error) {
    console.error('찜하기 토글 오류:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '찜하기 토글 중 오류가 발생했습니다.'
    });
  }
});

export default router; 