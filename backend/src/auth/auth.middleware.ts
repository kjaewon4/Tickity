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