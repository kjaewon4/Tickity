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
import { createClient } from '@supabase/supabase-js';
import { encryptResidentNumber, encrypt } from '../utils/encryption';
import { config, getDynamicConfig } from '../config/environment';
import { BlockchainService } from './blockchain.service';
import axios from 'axios';

const router = Router();
const bc     = new BlockchainService();

// 회원가입
router.post('/signup', async (req: Request<{}, {}, SignupRequest>, res: Response<ApiResponse>) => {
  try {
    const { email, password, name, resident_number } = req.body;
    const dynamicConfig = getDynamicConfig(req);

    // 입력 검증
    if (!email || !password || !name || !resident_number) {
      return res.status(400).json({
        success: false,
        error: '모든 필드를 입력해주세요.'
      });
    }

    // 주민번호 형식 검증
    if (!/^[0-9]{7}$/.test(resident_number)) {
      return res.status(400).json({
        success: false,
        error: '주민번호는 7자리 숫자로 입력해주세요.'
      });
    }

    console.log('=== 회원가입 시작 ===');
    console.log('Frontend URL:', dynamicConfig.FRONTEND_URL);
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Host:', req.headers.host);
    console.log('Email Redirect To:', `${dynamicConfig.FRONTEND_URL}/confirm-email`);

    // 이메일 중복 체크
    console.log('이메일 중복 체크 시작...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Supabase Auth 사용자 조회 오류:', authError);
      return res.status(500).json({
        success: false,
        error: '회원가입 중 오류가 발생했습니다.'
      });
    }

    // Supabase Auth에서 이메일로 사용자 찾기
    const existingAuthUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (existingAuthUser) {
      console.log('이미 Supabase Auth에 존재하는 이메일:', email);
      return res.status(400).json({
        success: false,
        error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.'
      });
    }

    // 데이터베이스에서도 이메일 중복 체크
    const { data: existingDbUser, error: dbError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (dbError) {
      console.error('데이터베이스 이메일 중복 체크 오류:', dbError);
      return res.status(500).json({
        success: false,
        error: '회원가입 중 오류가 발생했습니다.'
      });
    }

    if (existingDbUser) {
      console.log('이미 데이터베이스에 존재하는 이메일:', email);
      return res.status(400).json({
        success: false,
        error: '이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.'
      });
    }

    console.log('이메일 중복 체크 통과');

    // Supabase Auth로 회원가입 (이메일 인증 포함)
    const signUpOptions = {
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          resident_number: resident_number,
          password_hash: 'email_signup' // 가입자 유형 저장
        },
        emailRedirectTo: `${dynamicConfig.FRONTEND_URL}/confirm-email`
      }
    };

    console.log('Supabase SignUp Options:', JSON.stringify(signUpOptions, null, 2));

    const { data, error: signUpError } = await supabase.auth.signUp(signUpOptions);

    if (signUpError) {
      console.error('회원가입 오류:', signUpError);
      
      // Rate limit 에러 처리
      if (signUpError.code === 'over_email_send_rate_limit' || 
          signUpError.message.includes('rate limit') || 
          signUpError.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: '이메일 전송이 너무 많습니다. 잠시 후 다시 시도해주세요. (1-2분 후)'
        });
      } else if (signUpError.message.includes('email')) {
        return res.status(400).json({
          success: false,
          error: '이메일 관련 오류가 발생했습니다. 다른 이메일로 시도해주세요.'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: signUpError.message
        });
      }
    }

    // 회원가입 성공 시에만 이메일 유효성 검증 수행
    const mailboxlayerApiKeys = [
      process.env.MAILBOXLAYER_API_KEY1,
      process.env.MAILBOXLAYER_API_KEY2,
      process.env.MAILBOXLAYER_API_KEY3
    ];
    let mailboxRes, mailboxError;
    for (let i = 0; i < mailboxlayerApiKeys.length; i++) {
      try {
        const mailboxlayerUrl = `http://apilayer.net/api/check?access_key=${mailboxlayerApiKeys[i]}&email=${encodeURIComponent(email.trim())}&smtp=1&format=1`;
        mailboxRes = await axios.get(mailboxlayerUrl);
        mailboxError = null;
        break; // 성공하면 반복 종료
      } catch (err) {
        mailboxError = err;
        // 2번째 키로 재시도
      }
    }
    if (mailboxError || !mailboxRes) {
      console.warn('이메일 유효성 검증 실패, 하지만 회원가입은 성공:', mailboxError);
    } else {
      const { format_valid, smtp_check, mx_found } = mailboxRes.data;
      if (!format_valid || !smtp_check || !mx_found) {
        console.warn('이메일 유효성 검증 실패, 하지만 회원가입은 성공');
      }
    }

    if (data.user && !data.session) {
      // 이메일 인증이 필요한 경우
      res.json({
        success: true,
        message: '회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.'
      });
    } else {
      // 이메일 인증이 필요하지 않은 경우 (즉시 인증됨)
      res.json({
        success: true,
        message: '회원가입이 완료되었습니다!'
      });
    }

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    });
  }
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
      dateOfBirth: userData.resident_number_encrypted || '',
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
      dateOfBirth: userData.resident_number_encrypted || '',
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
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일 주소를 입력해주세요.'
      });
    }

    console.log('=== 이메일 중복 체크 시작 ===');
    console.log('확인할 이메일:', email);

    // 1. Supabase Auth에서 사용자 확인
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Supabase Auth 사용자 조회 오류:', authError);
      return res.status(500).json({
        success: false,
        error: '이메일 확인 중 오류가 발생했습니다.'
      });
    }

    // Supabase Auth에서 이메일로 사용자 찾기
    const authUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    console.log('Supabase Auth에서 찾은 사용자:', authUser ? '존재함' : '없음');

    // 2. 데이터베이스에서 사용자 확인
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (dbError) {
      console.error('데이터베이스 사용자 조회 오류:', dbError);
      return res.status(500).json({
        success: false,
        error: '이메일 확인 중 오류가 발생했습니다.'
      });
    }

    console.log('데이터베이스에서 찾은 사용자:', dbUser ? '존재함' : '없음');

    // 3. 결과 판단
    const exists = !!(authUser || dbUser);
    
    console.log('최종 결과 - 이메일 존재:', exists);

    res.json({
      success: true,
      data: {
        exists,
        authUser: !!authUser,
        dbUser: !!dbUser
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
    const dynamicConfig = getDynamicConfig(req);
    console.log('=== Google OAuth 시작 ===');
    console.log('Frontend URL:', dynamicConfig.FRONTEND_URL);
    console.log('Backend URL:', dynamicConfig.BACKEND_URL);
    console.log('Request Origin:', req.headers.origin);
    console.log('Request Host:', req.headers.host);
    
    // 프론트엔드로 직접 리다이렉트 (Supabase가 토큰을 처리)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${dynamicConfig.FRONTEND_URL}/login`,
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
    const dynamicConfig = getDynamicConfig(req);
    console.log('=== Google OAuth 콜백 디버그 ===');
    console.log('전체 URL:', req.url);
    console.log('Query 파라미터:', req.query);
    console.log('Headers:', req.headers);
    console.log('Frontend URL:', dynamicConfig.FRONTEND_URL);
    
    const { code, error, state } = req.query;
    console.log('Google OAuth 콜백 호출됨:', { 
      code: !!code, 
      error, 
      state: !!state,
      codeLength: code ? (code as string).length : 0
    });

    if (error) {
      console.error('Google OAuth 콜백 오류:', error);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=google_auth_failed&details=${error}`);
    }

    if (!code) {
      console.error('Google OAuth 코드 없음');
      console.log('전체 query 객체:', JSON.stringify(req.query, null, 2));
      console.log('전체 URL 파라미터:', req.url);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=no_code`);
    }

    console.log('코드 교환 시작...');
    // 코드로 세션 교환
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

    if (exchangeError) {
      console.error('세션 교환 오류:', exchangeError);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=session_exchange_failed&details=${exchangeError.message}`);
    }

    if (!data.session) {
      console.error('세션 데이터 없음');
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=no_session`);
    }

    console.log('세션 교환 성공, 사용자 ID:', data.user?.id);

    // 사용자 메타데이터에서 정보 추출
    const userMetadata = data.user.user_metadata;
    console.log('사용자 메타데이터:', userMetadata);
    
    const name = userMetadata?.name || '';
    const residentNumber = userMetadata?.resident_number || '';
    const passwordHash = userMetadata?.password_hash || 'email_signup'; // 기본값을 email_signup으로 설정

    console.log('추출된 정보:', { name, residentNumber: residentNumber ? '있음' : '없음', passwordHash: passwordHash ? '있음' : '없음' });

    // 주민번호 암호화
    let encryptedResidentNumber = 'not_provided'; // 기본값 설정 (NOT NULL 제약조건 때문)
    if (residentNumber) {
      try {
        encryptedResidentNumber = encryptResidentNumber(residentNumber);
      } catch (encryptError) {
        console.error('주민번호 암호화 오류:', encryptError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=resident_number_invalid`);
      }
    }

    console.log('지갑 생성 시작...');
    // 지갑 생성
    let address = '';
    let encryptedKey = '';
    
    try {
      const { address: walletAddress, privateKey } = await bc.createUserWallet();
      address = walletAddress;
      encryptedKey = encrypt(privateKey);
      console.log('지갑 생성 완료:', address);
    } catch (walletError) {
      console.error('지갑 생성 실패:', walletError);
      console.log('지갑 없이 사용자 정보 저장 진행');
      // 지갑 생성 실패 시에도 사용자 정보는 저장
      address = 'wallet_creation_failed';
      encryptedKey = 'wallet_creation_failed';
    }

    // 이미 사용자가 데이터베이스에 있는지 확인
    console.log('기존 사용자 확인 중...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_check_failed`);
    }

    console.log('기존 사용자 확인:', existingUser ? '존재함' : '존재하지 않음');

    // 사용자가 없으면 데이터베이스에 사용자 정보 저장
    if (!existingUser) {
      console.log('사용자 정보 저장 시작...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          name,
          resident_number_encrypted: encryptedResidentNumber,
          wallet_address: address,
          private_key_encrypted: encryptedKey,
          password_hash: 'google_oauth',
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('사용자 정보 저장 오류:', insertError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_creation_failed`);
      }

      console.log('사용자 정보 저장 성공');
    } else {
      console.log('사용자가 이미 존재하므로 저장 건너뜀');
    }

    // 인증 성공 후 로그인 페이지로 리다이렉트
    res.redirect(`${dynamicConfig.FRONTEND_URL}/login?message=email_confirmed`);

  } catch (error) {
    const dynamicConfig = getDynamicConfig(req);
    console.error('Google OAuth 콜백 오류:', error);
    res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=callback_failed&details=${error instanceof Error ? error.message : 'unknown'}`);
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
    const { name, resident_number, password_hash, password } = req.body;

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 주민번호 암호화
    let encryptedResidentNumber = 'not_provided'; // 기본값 설정 (NOT NULL 제약조건 때문)
    if (resident_number) {
      try {
        encryptedResidentNumber = encryptResidentNumber(resident_number);
      } catch (encryptError) {
        console.error('주민번호 암호화 오류:', encryptError);
        return res.status(400).json({
          success: false,
          error: '주민번호 형식이 올바르지 않습니다.'
        });
      }
    }

    // 사용자 정보 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        resident_number_encrypted: encryptedResidentNumber
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

    // 지갑 생성
    let address = '';
    let encryptedKey = '';
    
    try {
      const { address: walletAddress, privateKey } = await bc.createUserWallet();
      address = walletAddress;
      encryptedKey = encrypt(privateKey);
      console.log('지갑 생성 완료:', address);
    } catch (walletError) {
      console.error('지갑 생성 실패:', walletError);
      console.log('지갑 없이 사용자 정보 저장 진행');
      // 지갑 생성 실패 시에도 사용자 정보는 저장
      address = 'wallet_creation_failed';
      encryptedKey = 'wallet_creation_failed';
    }

    // Google OAuth 사용자 정보 생성
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name,
        resident_number_encrypted: 'not_provided', // 기본값 설정 (NOT NULL 제약조건 때문)
        wallet_address: address,
        private_key_encrypted: encryptedKey, // 지갑 개인키 암호화
        password_hash: 'google_oauth', // Google OAuth 사용자임을 명시
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

// 이메일 인증 확인
router.get('/confirm-email', async (req: Request, res: Response) => {
  try {
    console.log('=== 이메일 인증 확인 시작 ===');
    console.log('Query parameters:', req.query);
    console.log('Headers:', req.headers);
    
    const dynamicConfig = getDynamicConfig(req);
    const { token_hash, type, already_verified } = req.query;
    
    console.log('Token hash:', token_hash);
    console.log('Type:', type);
    console.log('Already verified:', already_verified);
    
    // 이미 인증된 경우 (access_token이 전달된 경우)
    if (already_verified === 'true' && token_hash) {
      console.log('이미 인증된 사용자 처리 시작...');
      
      // access_token으로 사용자 정보 조회
      const { data: { user }, error: authError } = await supabase.auth.getUser(token_hash as string);
      
      if (authError || !user) {
        console.error('이미 인증된 사용자 정보 조회 오류:', authError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_not_found`);
      }
      
      console.log('이미 인증된 사용자 발견:', user.id);
      
      // 사용자 메타데이터에서 정보 추출
      const userMetadata = user.user_metadata;
      console.log('사용자 메타데이터:', userMetadata);
      
      const name = userMetadata?.name || '';
      const residentNumber = userMetadata?.resident_number || '';
      const passwordHash = userMetadata?.password_hash || 'email_signup'; // 기본값을 email_signup으로 설정

      console.log('추출된 정보:', { name, residentNumber: residentNumber ? '있음' : '없음', passwordHash: passwordHash ? '있음' : '없음' });

      // 주민번호 암호화
      let encryptedResidentNumber = 'not_provided';
      if (residentNumber) {
        try {
          encryptedResidentNumber = encryptResidentNumber(residentNumber);
          console.log('주민번호 암호화 성공');
        } catch (encryptError) {
          console.error('주민번호 암호화 오류:', encryptError);
          return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=resident_number_invalid`);
        }
      }

      console.log('지갑 생성 시작...');
      // 지갑 생성
      let address = '';
      let encryptedKey = '';
      
      try {
        const { address: walletAddress, privateKey } = await bc.createUserWallet();
        address = walletAddress;
        encryptedKey = encrypt(privateKey);
        console.log('지갑 생성 완료:', address);
      } catch (walletError) {
        console.error('지갑 생성 실패:', walletError);
        console.log('지갑 없이 사용자 정보 저장 진행');
        // 지갑 생성 실패 시에도 사용자 정보는 저장
        address = 'wallet_creation_failed';
        encryptedKey = 'wallet_creation_failed';
      }

      // 이미 사용자가 데이터베이스에 있는지 확인
      console.log('기존 사용자 확인 중...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('사용자 확인 오류:', checkError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_check_failed`);
      }

      console.log('기존 사용자 확인:', existingUser ? '존재함' : '존재하지 않음');

      // 사용자가 없으면 데이터베이스에 사용자 정보 저장
      if (!existingUser) {
        console.log('사용자 정보 저장 시작...');
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name,
            resident_number_encrypted: encryptedResidentNumber,
            wallet_address: address,
            private_key_encrypted: encryptedKey,
            password_hash: passwordHash,
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('사용자 정보 저장 오류:', insertError);
          return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_creation_failed`);
        }

        console.log('사용자 정보 저장 성공');
      } else {
        console.log('사용자가 이미 존재하므로 저장 건너뜀');
      }

      console.log('인증 성공, 로그인 페이지로 리다이렉트');
      res.redirect(`${dynamicConfig.FRONTEND_URL}/login?message=email_confirmed`);
      return;
    }
    
    if (!token_hash || type !== 'signup') {
      console.log('토큰 해시 또는 타입이 유효하지 않음');
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=invalid_confirmation`);
    }

    console.log('이메일 인증 처리 시작...');
    // 이메일 인증 처리
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token_hash as string,
      type: 'signup'
    });

    if (error) {
      console.error('이메일 인증 오류:', error);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=confirmation_failed`);
    }

    console.log('이메일 인증 성공, 사용자 데이터:', data.user ? '존재함' : '없음');

    if (!data.user) {
      console.log('사용자 데이터가 없음');
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=no_user`);
    }

    // 사용자 메타데이터에서 정보 추출
    const userMetadata = data.user.user_metadata;
    console.log('사용자 메타데이터:', userMetadata);
    
    const name = userMetadata?.name || '';
    const residentNumber = userMetadata?.resident_number || '';
    const passwordHash = userMetadata?.password_hash || 'email_signup'; // 기본값을 email_signup으로 설정

    console.log('추출된 정보:', { name, residentNumber: residentNumber ? '있음' : '없음', passwordHash: passwordHash ? '있음' : '없음' });

    // 주민번호 암호화
    let encryptedResidentNumber = 'not_provided'; // 기본값 설정 (NOT NULL 제약조건 때문)
    if (residentNumber) {
      try {
        encryptedResidentNumber = encryptResidentNumber(residentNumber);
      } catch (encryptError) {
        console.error('주민번호 암호화 오류:', encryptError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=resident_number_invalid`);
      }
    }

    console.log('지갑 생성 시작...');
    // 지갑 생성
    let address = '';
    let encryptedKey = '';
    
    try {
      const { address: walletAddress, privateKey } = await bc.createUserWallet();
      address = walletAddress;
      encryptedKey = encrypt(privateKey);
      console.log('지갑 생성 완료:', address);
    } catch (walletError) {
      console.error('지갑 생성 실패:', walletError);
      console.log('지갑 없이 사용자 정보 저장 진행');
      // 지갑 생성 실패 시에도 사용자 정보는 저장
      address = 'wallet_creation_failed';
      encryptedKey = 'wallet_creation_failed';
    }

    // 이미 사용자가 데이터베이스에 있는지 확인
    console.log('기존 사용자 확인 중...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_check_failed`);
    }

    console.log('기존 사용자 확인:', existingUser ? '존재함' : '존재하지 않음');

    // 사용자가 없으면 데이터베이스에 사용자 정보 저장
    if (!existingUser) {
      console.log('사용자 정보 저장 시작...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: data.user.email,
          name,
          resident_number_encrypted: encryptedResidentNumber,
          wallet_address: address,
          private_key_encrypted: encryptedKey,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('사용자 정보 저장 오류:', insertError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=user_creation_failed`);
      }

      console.log('사용자 정보 저장 성공');
    } else {
      console.log('사용자가 이미 존재하므로 저장 건너뜀');
    }

    console.log('인증 성공, 로그인 페이지로 리다이렉트');
    // 인증 성공 후 로그인 페이지로 리다이렉트
    res.redirect(`${dynamicConfig.FRONTEND_URL}/login?message=email_confirmed`);

  } catch (error) {
    const dynamicConfig = getDynamicConfig(req);
    console.error('이메일 인증 확인 오류:', error);
    res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=confirmation_failed`);
  }
});

// 이메일 유효성 검증 (MailboxLayer API 사용)
router.post('/validate-email', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일 주소를 입력해주세요.'
      });
    }

    // 이메일 형식 기본 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        data: { valid: false, message: '올바른 이메일 형식이 아닙니다.' }
      });
    }

    // MailboxLayer API를 사용한 이메일 유효성 검증
    const mailboxlayerApiKeys = [
      process.env.MAILBOXLAYER_API_KEY1,
      process.env.MAILBOXLAYER_API_KEY2,
      process.env.MAILBOXLAYER_API_KEY3
    ];
    
    let mailboxRes, mailboxError;
    for (let i = 0; i < mailboxlayerApiKeys.length; i++) {
      if (!mailboxlayerApiKeys[i]) continue;
      
      console.log(`API 키 ${i + 1} 사용:`, mailboxlayerApiKeys[i]);
      
      try {
        const mailboxlayerUrl = `http://apilayer.net/api/check?access_key=${mailboxlayerApiKeys[i]}&email=${encodeURIComponent(email.trim())}&smtp=1&format=1`;
        mailboxRes = await axios.get(mailboxlayerUrl);
        mailboxError = null;
        break; // 성공하면 반복 종료
      } catch (err) {
        mailboxError = err;
        console.log(`API 키 ${i + 1} 실패:`, err);
        // 다음 키로 재시도
      }
    }

    if (mailboxError || !mailboxRes) {
      console.error('MailboxLayer API 오류:', mailboxError);
      return res.status(500).json({
        success: false,
        error: '이메일 유효성 검증 중 오류가 발생했습니다.'
      });
    }

    const { format_valid, smtp_check, mx_found } = mailboxRes.data;
    
    if (!format_valid || !smtp_check || !mx_found) {
      return res.status(200).json({
        success: true,
        data: { 
          valid: false, 
          message: '유효하지 않은 이메일 주소입니다. 올바른 이메일을 입력해주세요.' 
        }
      });
    }

    res.json({
      success: true,
      data: { valid: true }
    });

  } catch (error) {
    console.error('이메일 유효성 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 유효성 검증 중 오류가 발생했습니다.'
    });
  }
});

export default router; 