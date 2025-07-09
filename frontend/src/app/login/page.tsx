'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { LoginRequest } from '@/types/auth';
import Link from 'next/link';
import Image from 'next/image';
import CredentialBox from '../components/auth/CredentialBox';
import { FaUser, FaLock } from 'react-icons/fa';  
import { motion } from 'framer-motion';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  

  // URL fragment에서 Supabase OAuth 토큰 처리
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // URL 파라미터에서 메시지 확인
      const message = searchParams.get('message');
      if (message === 'email_confirmed') {
        setError('이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.');
      }

      // URL fragment에서 토큰 추출
      const hash = window.location.hash.substring(1); // '#' 제거
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('URL fragment 파라미터:', { accessToken: !!accessToken, refreshToken: !!refreshToken, error });

      // Supabase OAuth 토큰이 있는 경우에만 처리 (토큰이 있으면 error 무시)
      if (accessToken && refreshToken) {
        console.log('Supabase OAuth 토큰 발견, 처리 중...');

        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // URL에서 fragment 제거
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

        // 사용자 정보 확인 및 리다이렉트
        const checkUserAndRedirect = async () => {
          try {
            console.log('사용자 정보 확인 중...');
            const response = await apiClient.getUser();
            console.log('사용자 정보 응답:', response);

            if (response.success && response.data) {
              const user = response.data.user;
              if (user.hasEmbedding === false) {
                console.log('임베딩 없음, 얼굴 등록 페이지로 이동');
                router.push(`/face-registration?user_id=${user.id}`);
                return;
              }

              // 사용자 정보가 완전한지 확인
              if (user.name && user.residentNumber && user.residentNumber !== '1900-01-01' && user.residentNumber !== '') {
                // 기존 사용자 - 메인 페이지로
                console.log('기존 사용자, 메인 페이지로 이동');
                window.location.href = '/';
              } else {
                // 새 사용자 - 회원가입 완료 페이지로
                console.log('새 사용자, 회원가입 완료 페이지로 이동');
                window.location.href = '/signup/complete';
              }
            } else {
              // 사용자 정보 없음 - 회원가입 완료 페이지로
              console.log('사용자 정보 없음, 회원가입 완료 페이지로 이동');
              window.location.href = '/signup/complete';
            }
          } catch (error) {
            console.error('사용자 정보 확인 오류:', error);
            // 오류가 발생해도 회원가입 완료 페이지로 이동 (신규 사용자로 간주)
            console.log('오류 발생으로 인해 신규 사용자로 간주, 회원가입 완료 페이지로 이동');
            window.location.href = '/signup/complete';
          }
        };

        checkUserAndRedirect();
        return;
      }

      // OAuth 에러가 있는 경우 에러 표시 (토큰이 없을 때만)
      if (error && !accessToken) {
        console.error('OAuth 오류:', error, errorDescription);
        setError(`Google 로그인 중 오류가 발생했습니다: ${errorDescription || error}`);
      }
    }
  }, [searchParams, router]);

  // 구글 로그인
  const handleGoogleLogin = (): void => {
    console.log('Google 로그인 시작');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
    console.log('Google Auth URL:', googleAuthUrl);

    // 새 창에서 열기 (무한 로딩 방지)
    window.open(googleAuthUrl, '_self');
  };

  // 로그인
  const handleLogin = async (): Promise<void> => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const loginData: LoginRequest = {
        email: email.trim(),
        password: password
        
      };

      const response = await apiClient.login(loginData);

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        const user= response.data.user; // ✅ API 응답에서 userId 꺼내기
        const userId = user.id; // ✅ user.id 사용
      
        if (response.data.hasEmbedding === false) {
    router.push(`/face-registration?user_id=${userId}`);
        } else {
          // embedding 있으면 메인 페이지로 이동
          window.location.href = '/';
        }
      } else {
        setError(response.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 이벤트 핸들러 타입 정의
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-4 mt-16">
      {/* 고정된 로고 영역 */}
      <div className={`flex flex-col items-center justify-start mt-20 ${!showEmailForm ? 'mb-24' : 'mb-8'}`}>
        <Image
          src="/images/Tickity.svg"
          alt="Tickity 로고"
          width={200}
          height={60}
          priority
        />
        <div className="text-center mt-4 mb-8">
          <p className="text-lg font-semibold text-gray-900 mb-1">Tickity 계정 하나로</p>
          <p className="text-sm text-gray-500">다른 서비스를 모두 이용할 수 있어요.</p>
        </div>
      </div>

      {/* 로그인 영역 */}
      <div className="flex flex-col items-center">
        <div className={`w-full max-w-md ${!showEmailForm ? 'mt-[40px]' : ''}`}>
          {showEmailForm ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <CredentialBox
                email={email}
                password={password}
                showPassword={showPassword}
                onEmailChange={handleEmailChange}
                onPasswordChange={handlePasswordChange}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              <button
                className="w-full bg-blue-600 text-white py-3 mt-8 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>

              {error && <div className="text-red-500 mt-3 text-center">{error}</div>}

              <div className="mt-6 text-center">
                <span className="text-gray-600">계정이 없으신가요? </span>
                <Link href="/signup" className="text-blue-600 hover:underline cursor-pointer">
                  회원가입하기
                </Link>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-grow h-px bg-gray-300" />
                <span className="px-3 text-sm text-gray-400">또는</span>
                <div className="flex-grow h-px bg-gray-300" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 flex items-center justify-center text-lg cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                구글 로그인
              </button>
            </motion.div>
          ) : (
            <div>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded font-semibold hover:bg-gray-100 flex items-center justify-center text-lg cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                구글로 시작하기
              </button>

              <div className="flex items-center w-full my-6">
                <div className="flex-grow h-px bg-gray-300" />
                <span className="px-3 text-sm text-gray-400">또는</span>
                <div className="flex-grow h-px bg-gray-300" />
              </div>

              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded font-semibold hover:bg-gray-100 text-lg cursor-pointer"
              >
                기존 Tickity 계정 로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
