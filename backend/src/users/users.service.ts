import { User } from './users.model';
import { supabase } from '../lib/supabaseClient';
import { UserInfo } from '../types/auth';

// 레거시 메모리 기반 (하위 호환성)
const users: User[] = [];

export const getAllUsers = (): User[] => users;

export const createUser = (user: User): User => {
  users.push(user);
  return user;
};

/**
 * 사용자 ID로 프로필 정보 조회
 * @param userId - 사용자 ID
 * @returns 사용자 프로필 정보
 */
export const getUserProfile = async (userId: string): Promise<UserInfo | null> => {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        resident_number_encrypted,
        wallet_address,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('사용자 프로필 조회 오류:', error);
      return null;
    }

    // 타입 변환하여 반환
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      residentNumber: userData.resident_number_encrypted || '',
      walletAddress: userData.wallet_address || '',
      createdAt: userData.created_at
    };
  } catch (error) {
    console.error('getUserProfile 오류:', error);
    return null;
  }
};

/**
 * 사용자 정보 업데이트
 * @param userId - 사용자 ID
 * @param updateData - 업데이트할 데이터
 * @returns 업데이트된 사용자 정보
 */
export const updateUserProfile = async (
  userId: string, 
  updateData: Partial<Pick<UserInfo, 'name' | 'walletAddress'>>
): Promise<UserInfo | null> => {
  try {
    const dbUpdateData: any = {};
    
    if (updateData.name) {
      dbUpdateData.name = updateData.name;
    }
    if (updateData.walletAddress !== undefined) {
      dbUpdateData.wallet_address = updateData.walletAddress;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .update(dbUpdateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        name,
        resident_number_encrypted,
        wallet_address,
        created_at
      `)
      .single();

    if (error) {
      console.error('사용자 프로필 업데이트 오류:', error);
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      residentNumber: userData.resident_number_encrypted || '',
      walletAddress: userData.wallet_address || '',
      createdAt: userData.created_at
    };
  } catch (error) {
    console.error('updateUserProfile 오류:', error);
    return null;
  }
}; 