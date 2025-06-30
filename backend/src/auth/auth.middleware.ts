import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabaseClient';
import { ApiResponse } from '../types/auth';

// Request 객체에 user 정보 추가를 위한 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

// 관리자 지갑 주소 (환경변수에서 가져옴)
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

if (!ADMIN_ADDRESS) {
  throw new Error('ADMIN_ADDRESS가 환경변수에 설정되어 있지 않습니다.');
}

/**
 * JWT 토큰을 검증하고 사용자 정보를 Request에 추가하는 미들웨어
 */
export const authenticateToken = async (
  req: Request, 
  res: Response<ApiResponse>, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '접근 토큰이 필요합니다.'
      });
    }

    // Supabase JWT 토큰 검증
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 데이터베이스에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // Request 객체에 사용자 정보 추가
    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name
    };

    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 관리자 권한 검증 미들웨어
 * 사용자의 지갑 주소가 관리자 주소와 일치하는지 확인
 */
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 사용자의 지갑 주소 조회
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // 관리자 지갑 주소와 비교 (대소문자 구분 없이)
    if (userProfile.wallet_address?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      });
    }

    // 관리자 권한 확인됨 - 요청 객체에 사용자 정보 추가
    (req as any).user = user;
    (req as any).userProfile = userProfile;
    
    next();
  } catch (error) {
    console.error('관리자 권한 검증 오류:', error);
    return res.status(500).json({
      success: false,
      error: '권한 검증 중 오류가 발생했습니다.'
    });
  }
};

/**
 * 관리자 권한 확인 (권한만 확인, 오류 응답 없음)
 * @param walletAddress 사용자 지갑 주소
 * @returns 관리자 여부
 */
export const isAdmin = (walletAddress: string): boolean => {
  return walletAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}; 