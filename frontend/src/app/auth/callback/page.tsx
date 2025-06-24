'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>('로그인 처리 중...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth 오류:', error);
      setMessage('로그인 중 오류가 발생했습니다.');
      setTimeout(() => router.replace('/login'), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setMessage('로그인 성공!');
      setTimeout(() => {
        router.replace('/');
      }, 1500);
    } else {
      setMessage('인증 정보를 찾을 수 없습니다.');
      setTimeout(() => router.replace('/login'), 3000);
    }
    
    setIsLoading(false);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        <div className="text-center">
          {isLoading && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {isLoading ? '처리 중...' : '완료'}
          </h1>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
} 