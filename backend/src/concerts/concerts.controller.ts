import { Router, Request, Response } from 'express';
import { getSeatSummary, getAllConcerts, createConcert, getConcertById, deleteConcert, getConcerts, getUpcomingConcerts, getConcertDetail, listSectionAvailability, getConcertDetailByShortId, getConcertByShortId, searchConcerts, validateConcertSchedule } from './concerts.service';
import { ApiResponse } from '../types/auth';
import { supabase } from '../lib/supabaseClient';
import { requireAdminAuth } from '../auth/auth.middleware';
import * as ticketsService from '../tickets/tickets.service';

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
 * 콘서트 검색
 * GET /concerts/search?q=검색어&category=카테고리
 */
router.get('/search', async (req: Request, res: Response<ApiResponse>) => {
  const query = req.query.q as string | undefined;
  const category = req.query.category as string | undefined;

  try {
    let concerts;
    let message;

    if (!query || query.trim() === '') {
      // 검색어가 없으면 전체 콘서트 반환
      concerts = await getConcerts(category);
      message = category 
        ? `'${category}' 카테고리 전체 콘서트 (${concerts.length}개)`
        : `전체 콘서트 (${concerts.length}개)`;
    } else {
      // 검색어가 있으면 검색 실행
      concerts = await searchConcerts(query.trim(), category);
      message = `"${query.trim()}" 검색 결과 (${concerts.length}개)`;
    }

    res.json({
      success: true,
      data: {
        concerts,
        total: concerts.length,
        query: query?.trim() || '',
        category: category || '전체'
      },
      message,
    });
  } catch (err: any) {
    console.error('콘서트 검색 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '콘서트 검색 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 관리자용 콘서트 목록 조회
 * GET /concerts/admin
 */
router.get('/admin', /*requireAdminAuth,*/ async (req: Request, res: Response<ApiResponse>) => {
  try {
    const concerts = await getAllConcerts();

    res.json({
      success: true,
      data: {
        concerts,
        total: concerts.length,
      },
      message: '관리자용 콘서트 목록 조회 성공',
    });
  } catch (err: any) {
    console.error('관리자용 콘서트 목록 조회 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '관리자용 콘서트 목록 조회 중 오류가 발생했습니다.',
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
 * 간단한 ID로 공연 조회
 */
router.get('/:concertId', async (req, res) => {
  try {
    const { concertId } = req.params;
    
    // UUID 형식인지 확인
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(concertId);
    
    let concert;
    if (isUuid) {
      // UUID인 경우 직접 조회
      concert = await getConcertById(concertId);
    } else {
      // UUID가 아닌 경우 shortId로 조회 시도
      concert = await getConcertByShortId(concertId);
    }

    if (!concert) {
      return res.status(404).json({
        success: false,
        message: '공연을 찾을 수 없습니다.'
      });
    }

    // 공연 상세 정보 조회 (타임아웃 설정)
    const concertDetail = await Promise.race([
      getConcertDetail(concert.id),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('요청 시간 초과')), 8000)
      )
    ]);
    
    res.json({
      success: true,
      data: concertDetail
    });
  } catch (error: any) {
    console.error('공연 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message === '요청 시간 초과' 
        ? '요청 시간이 초과되었습니다. 다시 시도해주세요.'
        : '공연 조회 중 오류가 발생했습니다.'
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

router.get('/:concertId/:sectionId/seats', async (req: Request, res: Response) => {
  const { concertId, sectionId } = req.params;

  const { data, error } = await supabase.rpc('get_seat_status_by_section', {
    p_concert_id: concertId,
    p_section_id: sectionId
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: '좌석 상태 조회 실패' });
  }

  res.json({
    floor: data.length > 0 ? data[0].floor : null,
    zoneCode: data.length > 0 ? data[0].zone_code : null,
    seatMap: data.map((seat: any) => ({
      row: seat.row_number,
      col: seat.column_number,
      status: seat.status,
      holdExpiresAt: seat.hold_expires_at
    }))
  });
});

/**
 * 새 콘서트 생성 (관리자용)
 * POST /concerts
 */
router.post('/', /*requireAdminAuth,*/ async (req: Request, res: Response<ApiResponse>) => {
  try {
    const concertData = req.body;

    // 기본 필드 검증 - start_date와 start_time 사용
    if (!concertData.title || !concertData.start_date || !concertData.start_time || !concertData.venue_id) {
      return res.status(400).json({
        success: false,
        error: '필수 정보(제목, 날짜, 시간, 공연장)를 입력해주세요.'
      });
    }

    // 예매 기간 검증 - valid_from과 valid_to가 있는 경우
    if (concertData.valid_from && concertData.valid_to) {
      const concertDate = concertData.start_date; // 공연 날짜
      const validationResult = validateConcertSchedule(
        concertData.valid_from,
        concertData.valid_to,
        concertDate
      );

      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          error: `스케줄 검증 실패: ${validationResult.errorMessage}`
        });
      }
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
router.delete('/:concertId', /*requireAdminAuth,*/ async (req: Request, res: Response<ApiResponse>) => {
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
 * shortId로 공연 상세 정보 조회
 * GET /concerts/by-short-id/:shortId
 */
router.get('/by-short-id/:shortId', async (req: Request, res: Response<ApiResponse>) => {
  const { shortId } = req.params;

  try {
    if (!shortId) {
      return res.status(400).json({
        success: false,
        error: 'shortId가 필요합니다.'
      });
    }

    const detail = await getConcertDetailByShortId(shortId);

    res.json({
      success: true,
      data: detail,
      message: '공연 상세 정보 조회 성공'
    });
  } catch (err: any) {
    console.error('shortId로 공연 조회 오류:', err.message);
    res.status(500).json({
      success: false,
      error: '공연 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 찜하기 추가
 * POST /concerts/:concertId/favorite
 */
router.post('/:concertId/favorite', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.body.userId; // 실제로는 JWT 토큰에서 추출

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    // 이미 찜한 공연인지 확인
    const { data: existingFavorite, error: checkError } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('concert_id', concertId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('찜하기 확인 오류:', checkError);
      return res.status(500).json({
        success: false,
        error: '찜하기 확인 중 오류가 발생했습니다.'
      });
    }

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: '이미 찜한 공연입니다.'
      });
    }

    // 찜하기 추가
    const { data: newFavorite, error: insertError } = await supabase
      .from('user_favorites')
      .insert([{
        user_id: userId,
        concert_id: concertId
      }])
      .select()
      .single();

    if (insertError) {
      console.error('찜하기 추가 오류:', insertError);
      return res.status(500).json({
        success: false,
        error: '찜하기 추가 중 오류가 발생했습니다.'
      });
    }

    res.status(201).json({
      success: true,
      data: newFavorite,
      message: '찜하기가 추가되었습니다.'
    });
  } catch (error) {
    console.error('찜하기 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '찜하기 추가 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 찜하기 삭제
 * DELETE /concerts/:concertId/favorite
 */
router.delete('/:concertId/favorite', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.body.userId; // 실제로는 JWT 토큰에서 추출

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '로그인이 필요합니다.'
      });
    }

    // 찜하기 삭제
    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('concert_id', concertId);

    if (deleteError) {
      console.error('찜하기 삭제 오류:', deleteError);
      return res.status(500).json({
        success: false,
        error: '찜하기 삭제 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      message: '찜하기가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('찜하기 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '찜하기 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자의 찜한 공연 목록 조회
 * GET /concerts/favorites/:userId
 */
router.get('/favorites/:userId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;

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
      console.error('찜한 공연 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '찜한 공연 목록 조회 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: favorites,
      message: '찜한 공연 목록 조회 성공'
    });
  } catch (error) {
    console.error('찜한 공연 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '찜한 공연 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 공연의 찜하기 상태 확인
 * GET /concerts/:concertId/favorite/status
 */
router.get('/:concertId/favorite/status', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { concertId } = req.params;
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    const { data: favorite, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('concert_id', concertId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('찜하기 상태 확인 오류:', error);
      return res.status(500).json({
        success: false,
        error: '찜하기 상태 확인 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteId: favorite?.id || null
      },
      message: '찜하기 상태 확인 성공'
    });
  } catch (error) {
    console.error('찜하기 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '찜하기 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

// 좌석 HOLD 처리
router.post('/:concertId/seats/hold', async (req, res) => {
  const { concertId } = req.params;
  const { sectionId, row, col, userId } = req.body;

  if (!concertId || !sectionId || row === undefined || col === undefined || !userId) {
    return res.status(400).json({
      success: false,
      error: '필수 정보가 부족합니다.'
    });
  }

  // 1. 좌표 → seat_id 조회
  const seatId = await ticketsService.findSeatIdByPosition(sectionId, row, col);
  
  const { data: existingStatus } = await supabase
    .from('concert_seats')
    .select('current_status')
    .eq('concert_id', concertId)
    .eq('seat_id', seatId)
    .single();

  if (existingStatus?.current_status !== 'AVAILABLE') {
    return res.status(409).json({
      success: false,
      error: '이미 HOLD 중이거나 예매된 좌석입니다.'
    });
  }


  // 2. concert_seats 상태 → HOLD
  const holdUntil = new Date(Date.now() + 10 * 60 * 1000); // 10분 후

  // Test 1분 후
  // const holdUntil = new Date(Date.now() + 1 * 60 * 1000);

  const { error: updateError } = await supabase
    .from('concert_seats')
    .update({
      current_status: 'HOLD',
      last_action_user: userId,
      hold_expires_at: holdUntil.toISOString()
    })
    .match({
      concert_id: concertId,
      seat_id: seatId
    });

  if (updateError) {
    console.error('HOLD 업데이트 실패:', updateError.message);
    return res.status(500).json({
      success: false,
      error: '좌석을 HOLD 상태로 변경하는 데 실패했습니다.'
    });
  }

  return res.json({
    success: true,
    message: '좌석이 HOLD 상태로 설정되었습니다.',
    seatId,
    hold_expires_at: holdUntil.toISOString()
  });
});

// 클라이언트가 결제창 이탈 시, HOLD → ABALIABLE
router.post('/:concertId/seats/available', async (req, res) => {
  const { concertId } = req.params;
  const { sectionId, row, col, userId } = req.body;

  if (!concertId || !sectionId || row === undefined || col === undefined || !userId) {
    return res.status(400).json({
      success: false,
      error: '필수 정보가 부족합니다.'
    });
  }

  // 1. 좌표 → seat_id 조회
  const seatId = await ticketsService.findSeatIdByPosition(sectionId, row, col);
  
  const { data: existingSeat, error: fetchError } = await supabase
    .from('concert_seats')
    .select('current_status')
    .eq('concert_id', concertId)
    .eq('seat_id', seatId)
    .single();

    if (fetchError) {
    console.error('좌석 상태 조회 실패:', fetchError.message);
    return res.status(500).json({
      success: false,
      error: '좌석 정보를 조회하는 데 실패했습니다.'
    });
  }

  // 좌석이 존재하지 않는 경우 처리
  if (!existingSeat) {
    return res.status(404).json({
      success: false,
      error: '해당 좌석을 찾을 수 없습니다.'
    });
  }

  // SOLD 상태일 때만 명시적인 오류 메시지를 반환
  if (existingSeat.current_status === 'SOLD') {
    return res.status(409).json({ // 409 Conflict는 여전히 적절합니다.
      success: false,
      error: '이미 판매 완료된 좌석입니다.'
    });
  }

  const { error: updateError, count } = await supabase
    .from('concert_seats')
    .update({
      current_status: 'AVAILABLE',
      last_action_user: null,
      hold_expires_at: null
    })
    .match({
      concert_id: concertId,
      seat_id: seatId,
      current_status: existingSeat.current_status // 현재 조회된 상태 그대로 매치 (HOLD or AVAILABLE)
    });

  if (updateError) {
    console.error('AVAILABLE 업데이트 실패:', updateError.message);
    return res.status(500).json({
      success: false,
      error: '좌석을 AVAILABLE 상태로 변경하는 데 실패했습니다.'
    });
  }

  // 업데이트가 실제로 발생하지 않았을 경우 (예: 이미 AVAILABLE이었음)
  if (!count || count === 0) {
    console.log(`[${new Date().toISOString()}] 콘서트 ID: ${concertId}, 좌석 ID: ${seatId}는 이미 AVAILABLE 상태였습니다.`);
    return res.json({
      success: true,
      message: '좌석은 이미 AVAILABLE 상태였거나 성공적으로 설정되었습니다.',
      seatId,
    });
  }

  return res.json({
    success: true,
    message: '좌석이 AVAILABLE 상태로 설정되었습니다.',
    seatId,
  });
});

export default router; 