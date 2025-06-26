'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { UserMetadata } from '@/types/auth';

// 사용자 정보 타입 정의
interface UserInfo {
  email: string;
}

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [realName, setRealName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인 (Google OAuth 또는 일반 로그인)
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      // 현재 로그인된 사용자 정보 가져오기
      const getUserInfo = async (): Promise<void> => {
        try {
          const response = await apiClient.getUser();
          
          if (response.data?.user) {
            const user = response.data.user;
            
            // 기존 사용자인지 확인
            if (user.name && user.date_of_birth) {
              // 기존 사용자이고 정보가 완전하면 바로 메인 페이지로
              console.log('기존 사용자 발견. 메인 페이지로 이동');
              router.replace('/');
              return;
            }

            setUserInfo({
              email: user.email || ''
            });
            
            // 구글 이름을 기본값으로 설정하지 않음 - 사용자가 직접 입력하도록
          } else {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            router.replace('/login');
          }
        } catch (error: any) {
          console.error('사용자 정보 가져오기 오류:', error.message);
          router.replace('/login');
        }
      };

      getUserInfo();
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.replace('/login');
    }
  }, [router, realName]);

  const handleCompleteSignup = async (): Promise<void> => {
    if (!realName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!dateOfBirth) {
      setError('생년월일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 현재 사용자 정보 가져오기
      const response = await apiClient.getUser();
      
      if (!response.data?.user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const user = response.data.user;

      console.log('사용자 정보 업데이트:', {
        id: user.id,
        name: realName.trim(),
        email: userInfo?.email || user.email || '',
        date_of_birth: dateOfBirth
      });

      // 사용자가 데이터베이스에 있는지 확인
      const userCheckResponse = await apiClient.getUser();
      
      let updateResponse;
      if (userCheckResponse.data?.user && userCheckResponse.data.user.dateOfBirth) {
        // 기존 사용자 - 정보 업데이트
        updateResponse = await apiClient.updateUser({
          name: realName.trim(),
          date_of_birth: dateOfBirth
        });
      } else {
        // 신규 사용자 - 사용자 생성
        updateResponse = await apiClient.createGoogleUser({
          name: realName.trim(),
          date_of_birth: dateOfBirth
        });
      }

      if (updateResponse.success) {
        console.log('사용자 정보 업데이트 성공');
        setMessage('가입이 완료되었습니다!');
        setTimeout(() => {
          router.replace('/');
        }, 1500);
      } else {
        setError('사용자 정보 업데이트 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('사용자 정보 업데이트 오류:', error.message);
      setError('사용자 정보 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const setMessage = (message: string) => {
    // 메시지 설정 로직 (필요시 구현)
    console.log(message);
  };

  const handleRealNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRealName(e.target.value);
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setDateOfBirth(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>
        
        {userInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">이메일</p>
            <p className="font-medium">{userInfo.email}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="realName" className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              id="realName"
              value={realName}
              onChange={handleRealNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              생년월일 *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={handleDateOfBirthChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            onClick={handleCompleteSignup}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '가입하기'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 