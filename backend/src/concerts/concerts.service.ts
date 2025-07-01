import { Concert } from './concerts.model';
import { supabase } from '../lib/supabaseClient';

/* ─────────────────────── 공통 헬퍼 ─────────────────────── */

/** ★ concerts.id → venues.id 가져오기 (1줄짜리 공용 헬퍼) */
export const getConcertVenue = async (concertId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('concerts')
    .select('venue_id')
    .eq('id', concertId)
    .single();

  if (error || !data?.venue_id) throw error ?? new Error('venue_id 없음');
  return data.venue_id as string;
};

/**
 * ★ 좌석 가격(+선택적 총 좌석 수) 1회 호출 헬퍼
 *   withCount = true → total_seats 포함
 */
export async function fetchSeatPrices(concertId: string, withCount = false) {
  const venueId = await getConcertVenue(concertId);

  const { data, error } = await supabase.rpc('get_seat_grade_prices', {
    p_concert_id: concertId,
    p_venue_id:   venueId,
    p_with_count: withCount,   // true 면 total_seats 포함
  });
  if (error) throw error;

  return data;   // [{ id, grade_name, price, total_seats? }, …]
}

/**
 * 모든 콘서트 목록 조회
 * @returns 콘서트 목록
 */
export const getAllConcerts = async (): Promise<Concert[]> => {
  try {
    const { data: concertsData, error } = await supabase
      .from('concerts')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('콘서트 목록 조회 오류:', error);
      return [];
    }

    return concertsData || [];
  } catch (error) {
    console.error('getAllConcerts 오류:', error);
    return [];
  }
};

/**
 * 콘서트 ID로 특정 콘서트 조회
 * @param concertId - 콘서트 ID
 * @returns 콘서트 정보
 */
export const getConcertById = async (concertId: string): Promise<Concert | null> => {
  try {
    const { data: concertData, error } = await supabase
      .from('concerts')
      .select('*')
      .eq('id', concertId)
      .single();

    if (error) {
      console.error('콘서트 조회 오류:', error);
      return null;
    }

    return concertData;
  } catch (error) {
    console.error('getConcertById 오류:', error);
    return null;
  }
};

/**
 * 콘서트 생성 (관리자용)
 * @param concert - 콘서트 정보
 * @returns 생성된 콘서트 정보
 */
export const createConcert = async (concert: Omit<Concert, 'id' | 'created_at'>): Promise<Concert | null> => {
  try {
    const { data: newConcert, error } = await supabase
      .from('concerts')
      .insert([concert])
      .select()
      .single();

    if (error) {
      console.error('콘서트 생성 오류:', error);
      return null;
    }

    return newConcert;
  } catch (error) {
    console.error('createConcert 오류:', error);
    return null;
  }
};

/**
 * 콘서트 삭제 (관리자용)
 * @param concertId - 삭제할 콘서트 ID
 * @returns 삭제 성공 여부
 */
export const deleteConcert = async (concertId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('concerts')
      .delete()
      .eq('id', concertId);

    if (error) {
      console.error('콘서트 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('deleteConcert 오류:', error);
    return false;
  }
}; 


// 전체 또는 카테고리별 콘서트 조회
export const getConcerts = async (category?: string, availableOnly: boolean = false) => {
  const now = new Date().toISOString();
  
  let query = supabase
    .from('concerts')
    .select(`
      id,
      title,
      main_performer,
      date,
      start_date,
      start_time,
      poster_url,
      category,
      venue_id,
      ticket_open_at,
      valid_from,
      valid_to,
      venues!concerts_venue_id_fkey (
        name
      )
    `)
    .order('date', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  // 예매 가능한 콘서트만 필터링
  if (availableOnly) {
    // 공연 날짜가 오늘보다 뒤에 있어야 함
    query = query.gte('date', now);
  }

  const { data, error } = await query;
  if (error) throw error;

  let concerts = data.map((c: any) => ({
    id: c.id,
    title: c.title,
    main_performer: c.main_performer,
    date: c.date,
    start_date: c.start_date,
    start_time: c.start_time,
    poster_url: c.poster_url,
    category: c.category,
    venue_name: c.venues?.name || '장소 정보 없음',
    ticket_open_at: c.ticket_open_at,
    valid_from: c.valid_from,
    valid_to: c.valid_to,
  }));

  // 추가 필터링 (클라이언트 사이드에서 처리)
  if (availableOnly) {
    concerts = concerts.filter(concert => {
      // 1. 공연 날짜 체크 (start_date가 있으면 우선 사용)
      const concertDate = concert.start_date || concert.date;
      if (concertDate && new Date(concertDate) <= new Date()) {
        return false;
      }

      // 2. 티켓 오픈 시간 체크
      if (concert.ticket_open_at && new Date(concert.ticket_open_at) > new Date()) {
        return false; // 아직 티켓 판매 시작 전
      }

      // 3. 유효 기간 체크
      if (concert.valid_to && new Date(concert.valid_to) < new Date()) {
        return false; // 예매 기간 종료
      }

      return true;
    });
  }

  return concerts;
};

// 슬라이더용 다가오는 콘서트 8개 조회
export const getUpcomingConcerts = async () => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('concerts')
    .select(`
      id,
      title,
      main_performer,
      date,
      poster_url,
      venues (
        name
      )
    `)
    .gte('date', now)
    .order('date', { ascending: true })
    .limit(8);

  if (error) throw error;

  return data.map((c: any) => ({
    id: c.id,
    title: c.title,
    main_performer: c.main_performer,
    date: c.date,
    poster_url: c.poster_url,
    venue_name: c.venues?.name || '',
  }));
};


/* ─────────────────────── 상세 조회 ─────────────────────── */

/**
 * 콘서트 상세:
 * 1) concerts + venues
 * 2) seat_prices (가격+총석수)
 * 3) 취소 정책
 */
export const getConcertDetail = async (concertId: string) => {
  /* 1) 콘서트 + 공연장 메타 */
  const { data: concertData, error: concertError } = await supabase
    .from('concerts')
    .select(
      `
      *,
      venues ( id, name, address, capacity )
    `,
    )
    .eq('id', concertId)
    .single();

  if (concertError || !concertData) throw concertError;

  /* 2) 가격 + 총석수 */
  const seat_prices = await fetchSeatPrices(concertId, true);

  /* 3) 취소 정책 */
  const { data: policiesData, error: policyError } = await supabase
    .from('cancellation_policies')
    .select('period_desc, fee_desc')
    .eq('concert_id', concertId);

  if (policyError) throw policyError;

  return {
    concert: concertData,
    seat_prices,
    cancellation_policies: policiesData ?? [],
  };
};

/** 섹션별 남은 좌석 수 */
export async function listSectionAvailability(concertId: string) {
  const venueId = await getConcertVenue(concertId);

  const { data, error } = await supabase.rpc('get_section_availability', {
    p_concert_id: concertId,
    p_venue_id:   venueId,
  });
  if (error) throw error;

  /* data = [{ code:"43", available:123 }, …] */
  return data;
}

export interface ZoneInfo {
  code: string;
  available: number;
  total?: number;
  section_id: string;
}
export interface GradeSummary {
  grade_name: string;
  price: number;
  zones: ZoneInfo[];
}
/** 콘서트용 "등급→구역→잔여석" 요약 반환 */
export async function getSeatSummary(
  concertId: string,
  withTotal = false,
): Promise<GradeSummary[]> {
  const venueId = await getConcertVenue(concertId);

  const { data, error } = await supabase.rpc('get_grade_zone_availability', {
    p_concert_id: concertId,
    p_venue_id: venueId,
    p_with_total: withTotal,
  });
  if (error) throw error;

  /* 평면(행) → 계층(등급별 배열)으로 변환 */
  const map: Record<string, GradeSummary> = {};
  (data ?? []).forEach((row: any) => {
    if (!map[row.grade_name]) {
      map[row.grade_name] = {
        grade_name: row.grade_name,
        price: row.price,
        zones: [],
      };
    }
    map[row.grade_name].zones.push({
      code: row.zone_code,
      available: row.available,
      total: row.total ?? undefined,
      section_id: row.section_id,
    });
  });

  return Object.values(map);
}

/**
 * 간단한 ID로 공연 조회 (숫자 ID 또는 짧은 UUID)
 * @param shortId 간단한 ID
 * @returns 공연 정보
 */
export const getConcertByShortId = async (shortId: string): Promise<Concert | null> => {
  try {
    // 숫자 ID인 경우
    if (/^\d+$/.test(shortId)) {
      // 모든 공연을 가져와서 ID에서 숫자 부분을 추출하여 비교
      const { data: concerts, error } = await supabase
        .from('concerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('shortId로 공연 조회 오류:', error);
        return null;
      }

      // ID에서 숫자 부분을 추출하여 비교
      const foundConcert = concerts?.find(concert => {
        const numericPart = concert.id.replace(/[^0-9]/g, '');
        return numericPart === shortId;
      });

      return foundConcert || null;
    }

    // 짧은 UUID인 경우 (8자리)
    if (/^[0-9a-f]{8}$/i.test(shortId)) {
      const { data: concerts, error } = await supabase
        .from('concerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('shortId로 공연 조회 오류:', error);
        return null;
      }

      // UUID의 앞 8자리와 비교
      const foundConcert = concerts?.find(concert => 
        concert.id.toLowerCase().startsWith(shortId.toLowerCase())
      );

      return foundConcert || null;
    }

    return null;
  } catch (error) {
    console.error('getConcertByShortId 오류:', error);
    return null;
  }
};

/**
 * shortId로 공연 상세 정보 조회
 * @param shortId - 공연 ID의 앞 8글자
 * @returns 공연 상세 정보
 */
export const getConcertDetailByShortId = async (shortId: string) => {
  const concert = await getConcertByShortId(shortId);
  if (!concert) {
    throw new Error('공연을 찾을 수 없습니다.');
  }

  return getConcertDetail(concert.id);
};