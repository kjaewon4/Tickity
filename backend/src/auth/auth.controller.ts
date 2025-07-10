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
import { BlockchainService } from '../blockchain/blockchain.service';
import axios from 'axios';
import dns from 'dns';
import multer from 'multer';
const upload = multer();

const router = Router();
const bc = new BlockchainService();

// 회원가입
router.post('/signup', async (req: Request<{}, {}, SignupRequest>, res: Response<ApiResponse>) => {
  try {
    const { email, password, name, resident_number} = req.body;
    const dynamicConfig = getDynamicConfig(req);
    let embedding = null;

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

    // ✅ Supabase Auth로 회원가입 (이메일 인증 포함)
    const signUpOptions = {
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          resident_number,
          password_hash: 'email_signup'
        },
        emailRedirectTo: `${dynamicConfig.FRONTEND_URL}/confirm-email`
      }
    };

    console.log('Supabase SignUp Options:', JSON.stringify(signUpOptions, null, 2));

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(signUpOptions);

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
    // ✅ 회원가입 성공 시에만 이메일 유효성 검증 수행
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
        // 다음 키로 재시도
      }
    }
    if (mailboxError || !mailboxRes) {
      console.warn('이메일 유효성 검증 실패, 하지만 회원가입은 성공');
    } else {
      const { format_valid, smtp_check, mx_found } = mailboxRes.data;
      if (!format_valid || !smtp_check || !mx_found) {
        console.warn('이메일 유효성 검증 실패, 하지만 회원가입은 성공');
      }
    }

    // ✅ userId 가져오기
    let userId = signUpData.user?.id;

    if (!userId) {
      console.warn("❌ signUpData.user.id 없음, Admin API로 조회 시도");
      const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("❌ Supabase Admin listUsers 오류:", listError);
        return res.status(500).json({ success: false, error: '사용자 조회 실패' });
      }

      const user = usersList.users.find(u => u.email === email.trim().toLowerCase());
      if (user) {
        console.log("✅ Admin API로 user id 획득:", user.id);
        userId = user.id;
      } else {
        return res.status(400).json({ success: false, error: '회원가입 후 user id를 찾을 수 없습니다.' });
      }
    }

    // ✅ 응답 반환
    if (signUpData.user && !signUpData.session) {
      res.json({
        success: true,
        message: '회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.'
      });
    } else {
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

    // 데이터베이스에서 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      // 사용자가 데이터베이스에 없는 경우 (Google OAuth 신규 사용자)
      if (userError.code === 'PGRST116') {
        console.log('Google OAuth 신규 사용자 발견:', authData.user.id);

        // 신규 사용자 정보만 반환 (데이터베이스에 저장하지 않음)
        const newUserInfo: UserInfo = {
          id: authData.user.id,
          email: authData.user.email!,
          name: '', // 빈 문자열로 설정하여 사용자가 직접 입력하도록
          residentNumber: '', // 빈 문자열로 설정하여 회원가입 완료 페이지로 이동
          walletAddress: '',
          createdAt: new Date().toISOString()
        };

        return res.json({
          success: true,
          data: {
            user: newUserInfo,
            hasEmbedding: false // 신규 사용자는 embedding 없음으로 반환
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
      residentNumber: userData.resident_number_encrypted || '',
      walletAddress: userData.wallet_address,
      createdAt: userData.created_at
    };

    // ✅ 로그인 성공 후 embedding 존재 여부 확인
    console.log(`🔍 얼굴 임베딩 조회 시작: 사용자 ID ${userData.id}`);
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('face_embeddings')
      .select('embedding_enc')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (embeddingError) {
      console.error('임베딩 조회 오류:', embeddingError);
      return res.status(500).json({
        success: false,
        error: '임베딩 조회 중 오류가 발생했습니다.'
      });
    }

    console.log(`🔍 얼굴 임베딩 조회 결과:`, {
      hasEmbeddingData: !!embeddingData,
      embeddingDataLength: embeddingData?.embedding_enc?.length || 0,
      userDataId: userData.id
    });

    const hasEmbedding = !!embeddingData;

    const authResponse: AuthResponse = {
      user: userInfo,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      hasEmbedding // ✅ 추가
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

        // ✅ 신규 사용자도 hasEmbedding false로 반환
        const newUserInfo: UserInfo = {
          id: user.id,
          email: user.email!,
          name: '', // 빈 문자열로 설정하여 사용자가 직접 입력하도록
          residentNumber: '', // 빈 문자열로 설정하여 회원가입 완료 페이지로 이동
          walletAddress: '',
          createdAt: new Date().toISOString()
        };

        // embedding 조회 (없으므로 false)
        return res.json({
          success: true,
          data: {
            user: {
              ...newUserInfo,
              hasEmbedding: false // ✅ 추가
            }
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
      residentNumber: userData.resident_number_encrypted || '',
      walletAddress: userData.wallet_address,
      createdAt: userData.created_at
    };

    // ✅ 추가: 임베딩 존재 여부 확인
    console.log(`🔍 사용자 정보 조회 - 얼굴 임베딩 조회 시작: 사용자 ID ${userData.id}`);
    const { data: embeddingData, error: embeddingError } = await supabase
      .from('face_embeddings')
      .select('embedding_enc')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (embeddingError) {
      console.error('임베딩 조회 오류:', embeddingError);
      return res.status(500).json({
        success: false,
        error: '임베딩 조회 중 오류가 발생했습니다.'
      });
    }

    console.log(`🔍 사용자 정보 조회 - 얼굴 임베딩 조회 결과:`, {
      hasEmbeddingData: !!embeddingData,
      embeddingDataLength: embeddingData?.embedding_enc?.length || 0,
      userDataId: userData.id
    });

    const hasEmbedding = !!embeddingData;

    res.json({
      success: true,
      data: {
        user: {
          ...userInfo,
          hasEmbedding // ✅ 응답에 포함
        }
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

    // 프론트엔드에서 OAuth 처리 후 사용자 정보 확인하여 적절한 페이지로 이동
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${dynamicConfig.FRONTEND_URL}/auth/callback`,
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

// 구글 OAuth 콜백 처리 (현재 미사용 - 프론트엔드에서 처리)
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const dynamicConfig = getDynamicConfig(req);
    const { code, error } = req.query;

    if (error) {
      console.error('Google OAuth 콜백 오류:', error);
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=google_auth_failed&details=${error}`);
    }

    if (!code) {
      console.error('Google OAuth 코드 없음');
      return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=no_code`);
    }

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

    // 사용자 메타데이터에서 정보 추출
    const userMetadata = data.user.user_metadata;
    const name = userMetadata?.name || '';
    const residentNumber = userMetadata?.resident_number || '';

    // 주민번호 암호화
    let encryptedResidentNumber = 'not_provided';
    if (residentNumber) {
      try {
        encryptedResidentNumber = encryptResidentNumber(residentNumber);
      } catch (encryptError) {
        console.error('주민번호 암호화 오류:', encryptError);
        return res.redirect(`${dynamicConfig.FRONTEND_URL}/login?error=resident_number_invalid`);
      }
    }

    // 기존 사용자 확인 (최소 정보로 insert된 경우 포함)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
    }

    let needsSignupComplete = false;

    // ✅ 이미 있으면 update, 없으면 insert
    let address = '';
    let encryptedKey = '';
    if (!existingUser) {
      // 새로 insert
      try {
        const wallet = await bc.createUserWallet();
        address = wallet.address;
        encryptedKey = encrypt(wallet.privateKey);
      } catch (walletError) {
        address = 'wallet_creation_failed';
        encryptedKey = 'wallet_creation_failed';
      }
      needsSignupComplete = !name || !residentNumber;
      const { error: dbInsertError } = await supabase
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
      if (dbInsertError && dbInsertError.code !== '42501') {
        console.error('Google OAuth 사용자 DB 저장 오류:', dbInsertError);
        return res.status(500).json({
          success: false,
          error: '사용자 정보 생성 중 오류가 발생했습니다.'
        });
      }
    } else {
      // 이미 있으면 update (이메일, 이름, 주민번호, 지갑주소 등)
      let updateFields: any = {
        email: data.user.email,
        name,
        resident_number_encrypted: encryptedResidentNumber,
        password_hash: 'google_oauth'
      };
      // 지갑이 없으면 새로 생성
      if (!existingUser.wallet_address || !existingUser.private_key_encrypted || existingUser.wallet_address === '') {
        try {
          const wallet = await bc.createUserWallet();
          updateFields.wallet_address = wallet.address;
          updateFields.private_key_encrypted = encrypt(wallet.privateKey);
        } catch (walletError) {
          updateFields.wallet_address = 'wallet_creation_failed';
          updateFields.private_key_encrypted = 'wallet_creation_failed';
        }
      }
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', data.user.id);
      needsSignupComplete = !name || !residentNumber;
      if (dbUpdateError) {
        console.error('Google OAuth 사용자 DB 업데이트 오류:', dbUpdateError);
        return res.status(500).json({
          success: false,
          error: '사용자 정보 업데이트 중 오류가 발생했습니다.'
        });
      }
    }

    // 리다이렉트 결정
    if (needsSignupComplete) {
      res.redirect(`${dynamicConfig.FRONTEND_URL}/signup/complete?from=google`);
    } else {
      res.redirect(`${dynamicConfig.FRONTEND_URL}/login?message=email_confirmed`);
    }

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

    // 토큰으로 사용자 정보 조회 (여기서 email도 가져옴)
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

    // 사용자 정보 업데이트 (email은 Supabase Auth에서 가져온 값으로 항상 업데이트)
    const updateData: any = {
      name,
      resident_number_encrypted: encryptedResidentNumber,
      email: user.email,
      password_hash: 'google_oauth'
    };

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
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
    const { name, resident_number } = req.body;

    // 입력 검증
    if (!name || !resident_number) {
      return res.status(400).json({
        success: false,
        error: '이름과 주민번호를 입력해주세요.'
      });
    }

    // 주민번호 형식 검증
    if (!/^[0-9]{7}$/.test(resident_number)) {
      return res.status(400).json({
        success: false,
        error: '주민번호는 7자리 숫자로 입력해주세요.'
      });
    }

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    // 주민번호 암호화
    let encryptedResidentNumber = 'not_provided';
    try {
      encryptedResidentNumber = encryptResidentNumber(resident_number);
    } catch (encryptError) {
      console.error('주민번호 암호화 오류:', encryptError);
      return res.status(400).json({
        success: false,
        error: '주민번호 형식이 올바르지 않습니다.'
      });
    }

    // 지갑 생성
    let address = '';
    let encryptedKey = '';

    try {
      const { address: walletAddress, privateKey } = await bc.createUserWallet();
      address = walletAddress;
      encryptedKey = encrypt(privateKey);
    } catch (walletError) {
      console.error('지갑 생성 실패:', walletError);
      // 지갑 생성 실패 시에도 사용자 정보는 저장
      address = 'wallet_creation_failed';
      encryptedKey = 'wallet_creation_failed';
    }

    // 기존 사용자 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
    }

    // 사용자가 없으면 데이터베이스에 사용자 정보 저장
    if (!existingUser) {
      const { error: dbInsertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          name,
          resident_number_encrypted: encryptedResidentNumber,
          wallet_address: address,
          private_key_encrypted: encryptedKey,
          password_hash: 'google_oauth',
          created_at: new Date().toISOString()
        }]);

      if (dbInsertError && dbInsertError.code !== '42501') {
        console.error('Google OAuth 사용자 DB 저장 오류:', dbInsertError);
        return res.status(500).json({
          success: false,
          error: '사용자 정보 생성 중 오류가 발생했습니다.'
        });
      }
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
        .select('id, name, resident_number_encrypted')
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

    // 기존 사용자 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, name, resident_number_encrypted')
      .eq('id', data.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('사용자 확인 오류:', checkError);
    }

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

// 이메일 유효성 검증 (MX 레코드 기반)
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

    // MX 레코드 체크
    const domain = email.trim().split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return res.status(200).json({
          success: true,
          data: { valid: false, message: '유효하지 않은 이메일 입니다.' }
        });
      }
      return res.json({
        success: true,
        data: { valid: true }
      });
    });
  } catch (error) {
    console.error('이메일 유효성 검증 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 유효성 검증 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 관리자 주소 조회 (API 키 또는 관리자 권한)
 * GET /auth/admin-address
 */
router.get('/admin-address', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const adminAddress = process.env.ADMIN_ADDRESS;
    
    if (!adminAddress) {
      return res.status(500).json({
        success: false,
        error: '관리자 주소가 설정되지 않았습니다.'
      });
    }

    // 방법 1: API 키로 간단 인증
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    const validApiKey = process.env.ADMIN_API_KEY;
    
    if (apiKey && validApiKey && apiKey === validApiKey) {
      return res.json({
        success: true,
        data: { adminAddress }
      });
    }

    // 방법 2: JWT 토큰으로 관리자 권한 확인
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (!userError && user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('wallet_address')
            .eq('id', user.id)
            .single();

          if (!profileError && userProfile) {
            const isAdmin = userProfile.wallet_address?.toLowerCase() === adminAddress.toLowerCase();
            
            if (isAdmin) {
              return res.json({
                success: true,
                data: { adminAddress }
              });
            }
          }
        }
      } catch (error) {
        console.error('JWT 인증 오류:', error);
      }
    }

    // 인증 실패
    return res.status(401).json({
      success: false,
      error: '유효한 API 키 또는 관리자 권한이 필요합니다.'
    });

  } catch (error) {
    console.error('관리자 주소 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '관리자 주소 조회 중 오류가 발생했습니다.'
    });
  }
});

// 얼굴 임베딩 등록 (AI 서버 → Tickity 백엔드)
router.post('/face-register', upload.none(), async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { user_id, embedding_enc } = req.body;
    if (!user_id || !embedding_enc) {
      return res.status(400).json({
        success: false,
        error: 'user_id와 embedding_enc가 필요합니다.'
      });
    }

    // 1. users 테이블에 user_id가 있는지 확인
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({
        success: false,
        error: 'users 테이블 조회 중 오류가 발생했습니다.'
      });
    }

    // 2. 없으면 최소 정보로 insert (이메일 등은 알 수 없으니 빈 값)
    if (!existingUser) {
      // ✅ 지갑 생성
      let address = '';
      let encryptedKey = '';
      try {
        const { address: walletAddress, privateKey } = await bc.createUserWallet();
        address = walletAddress;
        encryptedKey = encrypt(privateKey);
      } catch (walletError) {
        address = 'wallet_creation_failed';
        encryptedKey = 'wallet_creation_failed';
      }
      const { error: insertUserError } = await supabase
        .from('users')
        .insert([{
          id: user_id,
          email: '',
          name: '',
          resident_number_encrypted: 'not_provided',
          wallet_address: address,
          private_key_encrypted: encryptedKey,
          password_hash: 'face_register',
          created_at: new Date().toISOString()
        }]);
      if (insertUserError && insertUserError.code !== '42501') {
        return res.status(500).json({
          success: false,
          error: 'users 테이블에 사용자 생성 중 오류가 발생했습니다.'
        });
      }
    }

    // 3. face_embeddings에 insert
    const { error: embeddingError } = await supabase
      .from('face_embeddings')
      .insert([{
        user_id,
        embedding_enc,
        created_at: new Date().toISOString()
      }]);
    if (embeddingError) {
      return res.status(500).json({
        success: false,
        error: `face_embeddings 저장 중 오류: ${embeddingError.message}`
      });
    }

    return res.json({
      success: true,
      message: '얼굴 임베딩 등록 성공'
    });
  } catch (error) {
    console.error('face-register 오류:', error);
    return res.status(500).json({
      success: false,
      error: '얼굴 임베딩 등록 중 서버 오류가 발생했습니다.'
    });
  }
});

export default router; 