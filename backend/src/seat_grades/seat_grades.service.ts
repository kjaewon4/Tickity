import { supabase } from '../lib/supabaseClient';
import { SeatGrade } from './seat_grades.model';

export const getAllSeatGrades = async (venue_id?: string): Promise<SeatGrade[]> => {
  try {
    let query = supabase
      .from('seat_grades')
      .select('*');
    
    // venue_id가 제공되면 해당 공연장의 좌석 등급만 조회
    if (venue_id) {
      query = query.eq('venue_id', venue_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('좌석 등급 조회 오류:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('좌석 등급 조회 중 오류:', error);
    return [];
  }
};

export const createSeatGrade = async (grade: SeatGrade): Promise<SeatGrade | null> => {
  try {
    const { data, error } = await supabase
      .from('seat_grades')
      .insert([grade])
      .select()
      .single();
    
    if (error) {
      console.error('좌석 등급 생성 오류:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('좌석 등급 생성 중 오류:', error);
    return null;
  }
}; 