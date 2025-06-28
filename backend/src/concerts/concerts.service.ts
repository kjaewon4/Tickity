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