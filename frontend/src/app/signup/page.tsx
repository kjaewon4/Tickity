'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { SignupRequest } from '@/types/auth';
import Link from 'next/link';

// 동적으로 Supabase 클라이언트 생성
const createSupabaseClient = () => {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordCheck, setPasswordCheck] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [residentNumber, setResidentNumber] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 주민번호 형식 검증
  const validateResidentNumber = (number: string): boolean => {
    return /^\d{7}$/.test(number);
  };

  // 일반 이메일 회원가입
  const handleSignup = async (): Promise<void> => {
    setError('');
    setSuccess('');
    
    if (password !== passwordCheck) {
      setError('비밀번호가 일치하지 않습니다.');
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
    
    try {
      const supabase = createSupabaseClient();
      
      // 현재 origin을 기반으로 이메일 리다이렉트 URL 설정
      const currentOrigin = window.location.origin;
      const emailRedirectUrl = `${currentOrigin}/confirm-email`;
      
      console.log('=== 프론트엔드 회원가입 시작 ===');
      console.log('Current Origin:', currentOrigin);
      console.log('Email Redirect URL:', emailRedirectUrl);

      // Supabase Auth로 직접 회원가입 (이메일 인증 포함)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            resident_number: residentNumber  // 주민번호 7자리
          },
          emailRedirectTo: emailRedirectUrl
        }
      });

      if (signUpError) {
        console.error('회원가입 오류:', signUpError);
        setError(signUpError.message);
        return;
      }

      if (data.user && data.session) {
        // 이메일 인증이 필요하지 않은 경우 (즉시 인증됨)
        setSuccess('회원가입이 완료되었습니다!');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else if (data.user && !data.session) {
        // 이메일 인증이 필요한 경우
        setSuccess('회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.');
        setTimeout(() => {
          router.replace('/login');
        }, 5000);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
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

  const handleResidentNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // 숫자만 입력 허용
    const value = e.target.value.replace(/[^0-9]/g, '');
    // 7자리로 제한
    setResidentNumber(value.slice(0, 7));
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
          type="text"
          placeholder="주민번호 7자리 (예: 950101)"
          value={residentNumber}
          onChange={handleResidentNumberChange}
          maxLength={7}
        />
        <div className="text-xs text-gray-500 mb-2">
          생년월일 6자리 + 성별 1자리 (예: 9501013)
        </div>
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