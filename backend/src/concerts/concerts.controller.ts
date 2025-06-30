import { Router, Request, Response } from 'express';
import { getSeatSummary, getAllConcerts, createConcert, getConcertById, deleteConcert, getConcerts, getUpcomingConcerts, getConcertDetail, listSectionAvailability, getAdminConcerts, saveConcertSeatPrices, getConcertSeatPrices } from './concerts.service';
import { ApiResponse } from '../types/auth';
import { supabase } from '../lib/supabaseClient';

const router = Router();

/**
 * 전체 또는 카테고리별 콘서트 목록 조회
 * GET /concerts
 * GET /concerts?category=여자아이돌
 */
router.get('/', async (req: Request, res: Response<ApiResponse>) => {
  const category = req.query.category as string | undefined;

  try {
    const concerts = await getConcerts(category);

    res.json({
      success: true,
      data: {
        concerts,
        total: concerts.length,
      },
      message: category
        ? `'${category}' 카테고리 콘서트 목록 조회 성공`
        : '전체 콘서트 목록 조회 성공',
    });
  } catch (err: any) {
    console.error('콘서트 목록 조회 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '콘서트 목록 조회 중 오류가 발생했습니다.',
    });
  }
});

/**
 * [GET] /concerts/upcoming  
 * 다가오는 콘서트 중 가까운 날짜 순 8개 조회 (슬라이더용)
 */
router.get('/upcoming', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const concerts = await getUpcomingConcerts();

    res.json({
      success: true,
      data: { concerts },
      message: '다가오는 콘서트 8개 조회 성공',
    });
  } catch (err: any) {
    console.error('[GET] /concerts/upcoming 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '다가오는 콘서트 조회 중 서버 오류 발생',
    });
  }
});

/**
 * [GET] /concerts/admin
 * 관리자용 콘서트 목록 조회 (모든 필드 + venues 정보 포함)
 */
router.get('/admin', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const concerts = await getAdminConcerts();

    res.json({
      success: true,
      data: {
        concerts,
        total: concerts.length,
      },
      message: '관리자 콘서트 목록 조회 성공',
    });
  } catch (err: any) {
    console.error('[GET] /concerts/admin 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '관리자 콘서트 목록 조회 중 서버 오류 발생',
    });
  }
});

/**
 * 특정 콘서트 상세 정보 조회
 * GET /concerts/:concertId
 * 콘서트 정보 (제목, 날짜, 공연장 이름 및 주소 등)
 * 좌석 등급 + 가격 + 총 좌석 수
 * 취소 수수료 정책
 */
router.get('/:concertId', async (req: Request, res: Response<ApiResponse>) => {
  const { concertId } = req.params;

  try {
    if (!concertId) {
      return res.status(400).json({
        success: false,
        error: '콘서트 ID가 필요합니다.'
      });
    }

    const detail = await getConcertDetail(concertId);

    res.json({
      success: true,
      data: detail,
      message: '콘서트 상세 정보 조회 성공'
    });
  } catch (err: any) {
    console.error('콘서트 조회 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '콘서트 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * GET /concerts/:concertId/seat-summary
 * → [
 *   { grade_name:"VIP", price:165000, zones:[{code:"F1",available:50}, …] },
 *   { grade_name:"일반석", price:132000, zones:[{code:"43",available:120}, …] }
 * ]
 */
router.get('/:concertId/seat-summary', async (req, res) => {
  const { concertId } = req.params;
  const { withTotal } = req.query; // ?withTotal=true

  try {
    const data = await getSeatSummary(
      concertId,
      withTotal === 'true',
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /concerts/:concertId/section-status
 * → [{ code:"43", available:123 }, …]
 * 섹션별 남은 좌석 수
 */
router.get('/:concertId/section-status', async (req, res) => {
  const { concertId } = req.params;
  try {
    const data = await listSectionAvailability(concertId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
    if (!concertData.title || !concertData.date || !concertData.venue_id) {
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

/**
 * GET /concerts/:concertId/seat-prices
 * 콘서트의 좌석 가격 조회
 */
router.get('/:concertId/seat-prices', async (req: Request, res: Response<ApiResponse>) => {
  const { concertId } = req.params;

  try {
    const seatPrices = await getConcertSeatPrices(concertId);
    
    res.json({
      success: true,
      data: seatPrices,
      message: '콘서트 좌석 가격 조회 성공'
    });
  } catch (error: any) {
    console.error('좌석 가격 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 가격 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * POST /concerts/:concertId/seat-prices
 * 콘서트의 좌석 가격 저장
 */
router.post('/:concertId/seat-prices', async (req: Request, res: Response<ApiResponse>) => {
  const { concertId } = req.params;
  const { seatPrices } = req.body;

  try {
    if (!Array.isArray(seatPrices)) {
      return res.status(400).json({
        success: false,
        error: '좌석 가격 배열이 필요합니다.'
      });
    }

    const success = await saveConcertSeatPrices(concertId, seatPrices);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: '좌석 가격 저장에 실패했습니다.'
      });
    }

    res.json({
      success: true,
      data: null,
      message: '좌석 가격 저장 성공'
    });
  } catch (error: any) {
    console.error('좌석 가격 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 가격 저장 중 오류가 발생했습니다.'
    });
  }
});

export default router; 