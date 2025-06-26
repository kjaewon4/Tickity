import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabaseClient';
import { 
  SignupRequest, 
  LoginRequest, 
  ApiResponse, 
  AuthResponse,
  UserInfo 
} from '../types/auth';

const router = Router();

// 회원가입 (프론트엔드에서만 처리하도록 비활성화)
router.post('/signup', async (req: Request<{}, {}, SignupRequest>, res: Response<ApiResponse>) => {
  return res.status(400).json({
    success: false,
    error: '회원가입은 프론트엔드에서 처리해주세요. (/signup 페이지 사용)'
  });
});

// 로그인
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<ApiResponse>) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // Supabase Auth로 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    if (!authData.user) {
      return res.status(401).json({
        success: false,
        error: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return res.status(500).json({
        success: false,
        error: '사용자 정보 조회 중 오류가 발생했습니다.'
      });
    }

    const userInfo: UserInfo = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      dateOfBirth: userData.date_of_birth,
      walletAddress: userData.wallet_address,
      createdAt: userData.created_at
    };

    const authResponse: AuthResponse = {
      user: userInfo,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token
    };

    res.json({
      success: true,
      data: authResponse,
      message: '로그인 성공'
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃
router.post('/logout', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 세션 무효화
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      console.error('로그아웃 오류:', error);
      return res.status(500).json({
        success: false,
        error: '로그아웃 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      message: '로그아웃 성공'
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 조회
router.get('/user', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 데이터베이스에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      // 사용자가 데이터베이스에 없는 경우 (Google OAuth 신규 사용자)
      if (userError.code === 'PGRST116') {
        console.log('Google OAuth 신규 사용자 발견:', user.id);
        
        // 신규 사용자 정보만 반환 (데이터베이스에 저장하지 않음)
        const newUserInfo: UserInfo = {
          id: user.id,
          email: user.email!,
          name: '', // 빈 문자열로 설정하여 사용자가 직접 입력하도록
          dateOfBirth: '', // 빈 문자열로 설정하여 회원가입 완료 페이지로 이동
          walletAddress: '',
          createdAt: new Date().toISOString()
        };

        return res.json({
          success: true,
          data: {
            user: newUserInfo
          }
        });
      }

      console.error('사용자 정보 조회 오류:', userError);
      return res.status(500).json({
        success: false,
        error: '사용자 정보 조회 중 오류가 발생했습니다.'
      });
    }

    const userInfo: UserInfo = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      dateOfBirth: userData.date_of_birth,
      walletAddress: userData.wallet_address,
      createdAt: userData.created_at
    };

    res.json({
      success: true,
      data: {
        user: userInfo
      }
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 중복 체크
router.get('/check-email/:email', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email } = req.params;

    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('이메일 중복 체크 오류:', error);
      return res.status(500).json({
        success: false,
        error: '이메일 확인 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        exists: !!existingUser
      }
    });

  } catch (error) {
    console.error('이메일 중복 체크 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 확인 중 오류가 발생했습니다.'
    });
  }
});

// 구글 OAuth 로그인 시작
router.get('/google', async (req: Request, res: Response) => {
  try {
    console.log('=== Google OAuth 시작 ===');
    console.log('Frontend URL:', process.env.FRONTEND_URL);
    console.log('Backend URL:', process.env.BACKEND_URL);
    
    // 프론트엔드로 직접 리다이렉트 (Supabase가 토큰을 처리)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/login`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('Google OAuth 오류:', error);
      return res.status(500).json({
        success: false,
        error: 'Google 로그인 중 오류가 발생했습니다.'
      });
    }

    console.log('Google OAuth URL 생성됨:', data.url);
    // Google OAuth URL로 리다이렉트
    res.redirect(data.url);
  } catch (error) {
    console.error('Google OAuth 오류:', error);
    res.status(500).json({
      success: false,
      error: 'Google 로그인 중 오류가 발생했습니다.'
    });
  }
});

// 구글 OAuth 콜백 처리
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    console.log('=== Google OAuth 콜백 디버그 ===');
    console.log('전체 URL:', req.url);
    console.log('Query 파라미터:', req.query);
    console.log('Headers:', req.headers);
    
    const { code, error, state } = req.query;
    console.log('Google OAuth 콜백 호출됨:', { 
      code: !!code, 
      error, 
      state: !!state,
      codeLength: code ? (code as string).length : 0
    });

    if (error) {
      console.error('Google OAuth 콜백 오류:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed&details=${error}`);
    }

    if (!code) {
      console.error('Google OAuth 코드 없음');
      console.log('전체 query 객체:', JSON.stringify(req.query, null, 2));
      console.log('전체 URL 파라미터:', req.url);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    console.log('코드 교환 시작...');
    // 코드로 세션 교환
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (exchangeError) {
      console.error('세션 교환 오류:', exchangeError);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=session_exchange_failed&details=${exchangeError.message}`);
    }

    if (!data.session) {
      console.error('세션 데이터 없음');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_session`);
    }

    console.log('세션 교환 성공, 사용자 ID:', data.user?.id);

    // 프론트엔드로 토큰과 함께 리다이렉트 (fragment 사용)
    const redirectUrl = `${process.env.FRONTEND_URL}/login#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&type=google`;
    console.log('리다이렉트 URL:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth 콜백 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed&details=${error instanceof Error ? error.message : 'unknown'}`);
  }
});

// 사용자 정보 업데이트
router.put('/user', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { name, date_of_birth } = req.body;

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 사용자 정보 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        date_of_birth
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('사용자 정보 업데이트 오류:', updateError);
      return res.status(500).json({
        success: false,
        error: '사용자 정보 업데이트 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 업데이트 중 오류가 발생했습니다.'
    });
  }
});

// Google OAuth 사용자 생성
router.post('/google-user', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { name, date_of_birth } = req.body;

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // Google OAuth 사용자 정보 생성
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name,
        date_of_birth,
        wallet_address: '',
        password_hash: 'google_oauth',
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Google OAuth 사용자 생성 오류:', insertError);
      return res.status(500).json({
        success: false,
        error: '사용자 정보 생성 중 오류가 발생했습니다.'
      });
    }

    res.json({
      success: true,
      message: 'Google OAuth 사용자가 생성되었습니다.'
    });

  } catch (error) {
    console.error('Google OAuth 사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 생성 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 인증 완료 후 사용자 생성
router.post('/create-user', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { name, date_of_birth, password_hash } = req.body;

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 이미 사용자가 데이터베이스에 있는지 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
      return res.status(500).json({
        success: false,
        error: '사용자 확인 중 오류가 발생했습니다.'
      });
    }

    // 사용자가 없으면 데이터베이스에 사용자 정보 저장
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name,
          date_of_birth,
          wallet_address: '',
          password_hash: password_hash || 'email_signup', // 기본값 설정
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('사용자 정보 저장 오류:', insertError);
        return res.status(500).json({
          success: false,
          error: '사용자 정보 저장 중 오류가 발생했습니다.'
        });
      }
    }

    res.json({
      success: true,
      message: '사용자 정보가 생성되었습니다.'
    });

  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 정보 생성 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 인증 확인
router.get('/confirm-email', async (req: Request, res: Response) => {
  try {
    const { token_hash, type } = req.query;
    
    if (!token_hash || type !== 'signup') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_confirmation`);
    }

    // 이메일 인증 처리
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token_hash as string,
      type: 'signup'
    });

    if (error) {
      console.error('이메일 인증 오류:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=confirmation_failed`);
    }

    if (!data.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
    }

    // 사용자 메타데이터에서 정보 추출
    const userMetadata = data.user.user_metadata;
    const name = userMetadata?.name || '';
    const dateOfBirth = userMetadata?.date_of_birth || '';
    const passwordHash = userMetadata?.password_hash || '';

    // 데이터베이스에 사용자 정보 저장
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        name,
        date_of_birth: dateOfBirth,
        wallet_address: '',
        password_hash: passwordHash,
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('사용자 정보 저장 오류:', insertError);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_creation_failed`);
    }

    // 인증 성공 후 로그인 페이지로 리다이렉트
    res.redirect(`${process.env.FRONTEND_URL}/login?message=email_confirmed`);

  } catch (error) {
    console.error('이메일 인증 확인 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=confirmation_failed`);
  }
});

export default router; 