import { Concert } from './concerts.model';
import { supabase } from '../lib/supabaseClient';

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
export const getConcerts = async (category?: string) => {
  let query = supabase
    .from('concerts')
    .select(`
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
    `)
    .order('ticket_open_at', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((c: any) => ({
    id: c.id,
    title: c.title,
    main_performer: c.main_performer,
    start_date: c.start_date,
    start_time: c.start_time,
    poster_url: c.poster_url,
    category: c.category,
    venue_name: c.venues?.name || '',
  }));
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

/**
 * 콘서트 상세 정보 조회 함수
 * 
 * 주어진 concertId에 대해 다음 정보를 통합 조회:
 * 1. 콘서트 기본 정보 및 공연장(venue)의 전체 정보 (좌석 조회용)
 * 2. concert_seat_prices + 해당 좌석 등급의 총 좌석 수
 * 3. 취소 수수료 정책 목록
 *
 * 반환 형태:
 * {
 *   concert: 콘서트 메타데이터,
 *   seat_prices: 좌석 등급별 가격 및 좌석 수,
 *   cancellation_policies: 취소 정책 배열
 * }
 */
export const getConcertDetail = async (concertId: string) => {
  // 1. concerts + venue 전체 정보 조회
  const { data: concertData, error: concertError } = await supabase
    .from('concerts')
    .select(`
      *,
      venues ( id, name, address, capacity )
    `)
    .eq('id', concertId)
    .single();

  if (concertError || !concertData) throw concertError;

  const venueId = concertData.venues?.id;


  // 2. seat 가격 정보 → RPC 함수로 가져오기 + 좌석 수 조회
  const { data: seatPriceRaw, error: seatPriceError } = await supabase
      .rpc('get_seat_grade_prices', {
        p_concert_id: concertId,
        p_venue_id: venueId,
      });

  if (seatPriceError) throw seatPriceError;

  // 3. 좌석 수 포함해서 seat_prices 구성
  const seat_prices = await Promise.all(
    (seatPriceRaw || []).map(async (item: any) => {
      const { count, error: countError } = await supabase
        .from('seats')
        .select('*', { count: 'exact', head: true })
        .eq('seat_grade_id', item.id);

      if (countError) throw countError;

      return {
        seat_grade_id: item.id,
        grade_name: item.grade_name,
        price: item.price,
        total_seats: count ?? 0
      };
    })
  );

  // 3. 취소 정책 조회
  const { data: policiesData, error: policyError } = await supabase
    .from('cancellation_policies')
    .select('period_desc, fee_desc')
    .eq('concert_id', concertId);

  if (policyError) throw policyError;

  return {
    concert: concertData,
    seat_prices,
    cancellation_policies: policiesData || []
  };

};