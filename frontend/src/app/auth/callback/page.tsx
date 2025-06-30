'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL hash에서 토큰 정보 파싱
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('OAuth 오류:', error, errorDescription);
          router.replace(`/login?error=${error}`);
          return;
        }

        if (!accessToken || !refreshToken) {
          router.replace('/login?error=no_token');
          return;
        }

        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // 사용자 정보 가져오기
        try {
          const userResponse = await apiClient.getUserWithToken(accessToken);
          
          if (!userResponse.data?.user) {
            router.replace('/login?error=user_not_found');
            return;
          }

          const user = userResponse.data.user;

          // 사용자 정보 완전성 검사
          const hasName = user.name && user.name.trim() !== '';
          const hasResidentNumber = user.residentNumber && 
                                  user.residentNumber !== '1900-01-01' && 
                                  user.residentNumber !== '' &&
                                  user.residentNumber !== 'not_provided';

          if (hasName && hasResidentNumber) {
            // 기존 사용자이고 정보가 완전한 경우 메인 페이지로
            router.replace('/');
          } else {
            // 신규 사용자이거나 정보가 불완전한 경우 회원가입 완료 페이지로
            router.replace(`/signup/complete?from=google&token=${accessToken}&refresh=${refreshToken}`);
          }

        } catch (userError: any) {
          // 신규 사용자인 경우 (사용자 정보가 DB에 없음)
          if (userError.message && (userError.message.includes('404') || userError.message.includes('찾을 수 없습니다'))) {
            router.replace(`/signup/complete?from=google&token=${accessToken}&refresh=${refreshToken}`);
          } else {
            console.error('사용자 정보 가져오기 오류:', userError);
            router.replace('/login?error=user_info_failed');
          }
        }

      } catch (error) {
        console.error('OAuth 콜백 처리 오류:', error);
        router.replace('/login?error=callback_failed');
      }
    };

    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">로그인 처리 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    </div>
  );
} 