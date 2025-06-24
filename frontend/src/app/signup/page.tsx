'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { SignupRequest } from '@/types/auth';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordCheck, setPasswordCheck] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 일반 이메일 회원가입
  const handleSignup = async (): Promise<void> => {
    setError('');
    setSuccess('');
    
    if (password !== passwordCheck) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!dateOfBirth) {
      setError('생년월일을 입력해주세요.');
      return;
    }
    
    try {
      const signupData: SignupRequest = {
        email: email.trim(),
        password,
        name: name.trim(),
        dateOfBirth
      };

      const response = await apiClient.signup(signupData);
      
      if (response.success && response.data) {
        if (response.data.requiresEmailConfirmation) {
          // 이메일 인증이 필요한 경우
          setSuccess('회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.');
          
          // 로그인 페이지로 이동하지 않고 인증 안내만 표시
          setTimeout(() => {
            router.replace('/login');
          }, 5000);
        } else {
          // 이메일 인증이 완료된 경우 (토큰이 있는 경우)
          if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          setSuccess('회원가입이 완료되었습니다!');
          
          // 잠시 후 로그인 페이지로 이동
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
        }
      } else {
        setError(response.error || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  // 이벤트 핸들러 타입 정의
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  const handlePasswordCheckChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPasswordCheck(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setDateOfBirth(e.target.value);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded shadow text-center">
          <h1 className="text-2xl font-bold mb-6">🎉 회원가입 완료!</h1>
          <p className="mb-4">{success}</p>
          <p className="text-sm text-gray-600">잠시 후 홈페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Tickity 회원가입</h1>
        
        <div className="text-center text-gray-400 my-2">이메일로 회원가입</div>
        
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="이름"
          value={name}
          onChange={handleNameChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={handleEmailChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          type="date"
          placeholder="생년월일"
          value={dateOfBirth}
          onChange={handleDateOfBirthChange}
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={handlePasswordChange}
        />
        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="비밀번호 확인"
          value={passwordCheck}
          onChange={handlePasswordCheckChange}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
          onClick={handleSignup}
        >
          이메일로 회원가입
        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
        
        <div className="mt-4 text-center">
          <span className="text-gray-600">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
} 