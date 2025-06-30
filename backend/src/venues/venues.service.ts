import { Venue, CreateVenueRequest, UpdateVenueRequest } from './venues.model';
import { supabase } from '../lib/supabaseClient';

/**
 * 모든 공연장 목록 조회
 * @returns 공연장 목록
 */
export const getAllVenues = async (): Promise<Venue[]> => {
  try {
    const { data: venuesData, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('공연장 목록 조회 오류:', error);
      return [];
    }

    return venuesData || [];
  } catch (error) {
    console.error('getAllVenues 오류:', error);
    return [];
  }
};

/**
 * 공연장 ID로 특정 공연장 조회
 * @param venueId - 공연장 ID
 * @returns 공연장 정보
 */
export const getVenueById = async (venueId: string): Promise<Venue | null> => {
  try {
    const { data: venueData, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('공연장 조회 오류:', error);
      return null;
    }

    return venueData;
  } catch (error) {
    console.error('getVenueById 오류:', error);
    return null;
  }
};

/**
 * 공연장 생성
 * @param venue - 공연장 정보
 * @returns 생성된 공연장 정보
 */
export const createVenue = async (venue: CreateVenueRequest): Promise<Venue | null> => {
  try {
    const { data: newVenue, error } = await supabase
      .from('venues')
      .insert([venue])
      .select()
      .single();

    if (error) {
      console.error('공연장 생성 오류:', error);
      return null;
    }

    return newVenue;
  } catch (error) {
    console.error('createVenue 오류:', error);
    return null;
  }
};

/**
 * 공연장 정보 수정
 * @param venueId - 공연장 ID
 * @param updateData - 수정할 데이터
 * @returns 수정된 공연장 정보
 */
export const updateVenue = async (
  venueId: string, 
  updateData: UpdateVenueRequest
): Promise<Venue | null> => {
  try {
    const { data: updatedVenue, error } = await supabase
      .from('venues')
      .update(updateData)
      .eq('id', venueId)
      .select()
      .single();

    if (error) {
      console.error('공연장 수정 오류:', error);
      return null;
    }

    return updatedVenue;
  } catch (error) {
    console.error('updateVenue 오류:', error);
    return null;
  }
};

/**
 * 공연장 삭제
 * @param venueId - 공연장 ID
 * @returns 삭제 성공 여부
 */
export const deleteVenue = async (venueId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', venueId);

    if (error) {
      console.error('공연장 삭제 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('deleteVenue 오류:', error);
    return false;
  }
}; 

// 특정 공연장의 구역(section) 정보 조회
export const getSectionsByVenueId = async (venueId: string) => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('venue_id', venueId);

  if (error) throw error;

  return data;
};

/**
 * 특정 공연장의 좌석 등급 정보 조회
 */
export const getSeatGradesByVenueId = async (venueId: string) => {
  try {
    const { data, error } = await supabase
      .from('seat_grades')
      .select('*')
      .eq('venue_id', venueId)
      .order('grade_name', { ascending: true });

    if (error) {
      console.error('좌석 등급 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getSeatGradesByVenueId 오류:', error);
    return [];
  }
};