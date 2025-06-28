'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { LoginRequest } from '@/types/auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
              
              // 사용자 정보가 완전한지 확인
              if (user.name && user.residentNumber && user.residentNumber !== '1900-01-01' && user.residentNumber !== '') {
                // 기존 사용자 - 메인 페이지로
                console.log('기존 사용자, 메인 페이지로 이동');
                router.replace('/');
              } else {
                // 새 사용자 - 회원가입 완료 페이지로
                console.log('새 사용자, 회원가입 완료 페이지로 이동');
                router.replace('/signup/complete');
              }
            } else {
              // 사용자 정보 없음 - 회원가입 완료 페이지로
              console.log('사용자 정보 없음, 회원가입 완료 페이지로 이동');
              router.replace('/signup/complete');
            }
          } catch (error) {
            console.error('사용자 정보 확인 오류:', error);
            // 오류가 발생해도 회원가입 완료 페이지로 이동 (신규 사용자로 간주)
            router.replace('/signup/complete');
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
        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        // 로그인 성공 시 메인 페이지로 이동
        router.replace('/');
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Tickity 로그인</h1>
        
        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full mb-4 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded font-semibold hover:bg-gray-50 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 로그인
        </button>

        <div className="text-center text-gray-400 my-2">또는</div>

        <div>
          <input
            className="w-full mb-4 p-2 border rounded"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={handleEmailChange}
            onKeyPress={handleKeyPress}
          />
          <input
            className="w-full mb-4 p-2 border rounded"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
            onKeyPress={handleKeyPress}
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {error && <div className="text-red-500 mt-2 text-center">{error}</div>}
        
        <div className="mt-4 text-center">
          <span className="text-gray-600">계정이 없으신가요? </span>
          <Link href="/signup" className="text-blue-600 hover:underline">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
} 