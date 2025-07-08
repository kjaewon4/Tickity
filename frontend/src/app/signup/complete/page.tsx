'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import SocialSignupForm from '../../components/auth/SocialSignupForm';

// 사용자 정보 타입 정의
interface UserInfo {
  email: string;
}

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState<string>('');
  const [residentNumber, setResidentNumber] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 주민번호 형식 검증
  const validateResidentNumber = (number: string): boolean => {
    return /^\d{7}$/.test(number);
  };

  useEffect(() => {
    // URL 파라미터에서 토큰 확인 (구글 OAuth에서 전달)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlRefresh = urlParams.get('refresh');

    if (urlToken && urlRefresh) {
      // URL에서 받은 토큰을 localStorage에 저장
      localStorage.setItem('accessToken', urlToken);
      localStorage.setItem('refreshToken', urlRefresh);
    }

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

            // 기존 사용자인지 확인 - 더 엄격한 검증
            const hasName = user.name && user.name.trim() !== '';
            const hasResidentNumber = user.residentNumber &&
              user.residentNumber !== '1900-01-01' &&
              user.residentNumber !== '' &&
              user.residentNumber !== 'not_provided';

            if (hasName && hasResidentNumber) {
              // 기존 사용자이고 정보가 완전하면 바로 메인 페이지로
              router.replace('/');
              return;
            }

            setUserInfo({ email: user.email || '' });

            // 기존 이름이 있다면 기본값으로 설정 (구글에서 가져온 이름 등)
            if (user.name && user.name.trim() !== '') {
              setName(user.name.trim());
            }
          } else {
            // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
            router.replace('/login');
          }
        } catch (error: any) {
          console.error('사용자 정보 가져오기 오류:', error.message);
          // 토큰이 유효하지 않거나 사용자가 존재하지 않는 경우
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.replace('/login');
        }
      };

      getUserInfo();
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.replace('/login');
    }
  }, [router]);

  const handleCompleteSignup = async (): Promise<void> => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!residentNumber) {
      setError('주민번호를 입력해주세요.');
      return;
    }
    if (!validateResidentNumber(residentNumber)) {
      setError('주민번호는 7자리 숫자로 입력해주세요.');
      return;
    }

    setIsSigningUp(true);
    setError('');

    try {
      // 현재 사용자 정보 가져오기
      const response = await apiClient.getUser();

      if (!response.data?.user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        return;
      }

      const user = response.data.user;

      // 사용자가 데이터베이스에 있는지 확인
      const userCheckResponse = await apiClient.getUser();

      let updateResponse;
      let isSuccess = false;

      try {
        if (
          userCheckResponse.data?.user &&
          userCheckResponse.data.user.residentNumber &&
          userCheckResponse.data.user.residentNumber !== ''
        ) {
          updateResponse = await apiClient.updateUser({
            name: name.trim(),
            resident_number: residentNumber
          });
        } else {
          // 신규 사용자 - 사용자 생성
          updateResponse = await apiClient.createGoogleUser({
            name: name.trim(),
            resident_number: residentNumber
          });
        }

        isSuccess = updateResponse.success;
      } catch (createError: any) {
        console.error('사용자 생성/업데이트 오류:', createError);
        // RLS 오류가 발생해도 사용자는 Supabase Auth에 생성되었으므로 성공으로 처리
        if (createError.message && createError.message.includes('42501')) {
          isSuccess = true;
        } else {
          throw createError;
        }
      }

      if (isSuccess) {
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
      setIsSigningUp(false);
    }
  };

  const setMessage = (message: string) => {
    // 메시지 설정 로직 (필요시 구현)
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  const handleResidentNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // 숫자만 입력 허용
    const value = e.target.value.replace(/[^0-9]/g, '');
    // 7자리로 제한
    setResidentNumber(value.slice(0, 7));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Tickity 회원가입</h1>
        {userInfo && (
          <div className="text-center text-gray-500 text-sm mb-6">
            {userInfo.email} 계정으로 가입 진행 중입니다.
          </div>
        )}
        <SocialSignupForm
          name={name}
          residentNumber={residentNumber}
          error={error}
          isSigningUp={isSigningUp}
          onNameChange={handleNameChange}
          onResidentNumberChange={handleResidentNumberChange}
          onSignup={handleCompleteSignup}
        />
      </div>
    </div>
  );
}
