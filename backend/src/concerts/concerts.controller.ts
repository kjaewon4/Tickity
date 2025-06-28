import { Router, Request, Response } from 'express';
import { getAllConcerts, createConcert, getConcertById, deleteConcert } from './concerts.service';
import { ApiResponse } from '../types/auth';

const router = Router();

/**
 * 전체 콘서트 목록 조회
 * GET /concerts
 */
router.get('/', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const concerts = await getAllConcerts();

    res.json({
      success: true,
      data: {
        concerts,
        total: concerts.length
      },
      message: '콘서트 목록 조회 성공'
    });
  } catch (error) {
    console.error('콘서트 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '콘서트 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 콘서트 상세 정보 조회
 * GET /concerts/:concertId
 */
router.get('/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '콘서트 ID가 필요합니다.'
      });
    }

    const concert = await getConcertById(concertId);

    if (!concert) {
      return res.status(404).json({
        success: false,
        error: '콘서트 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: concert,
      message: '콘서트 상세 정보 조회 성공'
    });
  } catch (error) {
    console.error('콘서트 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '콘서트 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 새 콘서트 생성 (관리자용)
 * POST /concerts
 */
router.post('/', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const concertData = req.body;

    // 기본 필드 검증
    if (!concertData.title || !concertData.date || !concertData.location) {
      return res.status(400).json({
        success: false,
        error: '필수 정보(제목, 날짜, 장소)를 입력해주세요.'
      });
    }

    const newConcert = await createConcert(concertData);

    if (!newConcert) {
      return res.status(500).json({
        success: false,
        error: '콘서트 생성에 실패했습니다.'
      });
    }

    res.status(201).json({
      success: true,
      data: newConcert,
      message: '콘서트 생성 성공'
    });
  } catch (error) {
    console.error('콘서트 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '콘서트 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 콘서트 삭제 (관리자용)
 * DELETE /concerts/:concertId
 */
router.delete('/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;

    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '콘서트 ID가 필요합니다.'
      });
    }

    // 콘서트 존재 여부 확인
    const existingConcert = await getConcertById(concertId);
    if (!existingConcert) {
      return res.status(404).json({
        success: false,
        error: '콘서트를 찾을 수 없습니다.'
      });
    }

    const deleted = await deleteConcert(concertId);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: '콘서트 삭제에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      data: null,
      message: '콘서트 삭제 성공'
    });
  } catch (error) {
    console.error('콘서트 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '콘서트 삭제 중 오류가 발생했습니다.'
    });
  }
});

export default router; 