'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordCheck, setPasswordCheck] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [residentNumber, setResidentNumber] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  
  // 이메일 중복 체크 관련 상태
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [emailToCheck, setEmailToCheck] = useState<string>(''); // 검증할 이메일 저장

  // 주민번호 형식 검증
  const validateResidentNumber = (number: string): boolean => {
    return /^\d{7}$/.test(number);
  };

  // 이메일 중복 체크 함수
  const checkEmailAvailability = async (emailToCheck: string): Promise<void> => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailStatus('idle');
      setEmailMessage('');
      return;
    }

    setEmailStatus('checking');
    setEmailMessage('이메일 확인 중...');

    try {
      // 1. 이메일 중복 체크
      const duplicateResult = await apiClient.checkEmail(emailToCheck.trim());

      if (!duplicateResult.success) {
        setEmailStatus('error');
        setEmailMessage('이메일 확인 중 오류가 발생했습니다.');
        return;
      }

      if (duplicateResult.data?.exists) {
        setEmailStatus('taken');
        setEmailMessage('이미 가입된 이메일입니다.');
        return;
      }

      // 2. 이메일 유효성 검증 (중복되지 않은 경우에만)
      const validationResult = await apiClient.validateEmail(emailToCheck.trim());

      if (!validationResult.success) {
        setEmailStatus('error');
        setEmailMessage('이메일 유효성 검증 중 오류가 발생했습니다.');
        return;
      }

      if (!validationResult.data?.valid) {
        setEmailStatus('error');
        setEmailMessage(validationResult.data?.message || '유효하지 않은 이메일 주소입니다.');
        return;
      }

      // 중복되지 않고 유효한 이메일
      setEmailStatus('available');
      setEmailMessage('사용 가능한 이메일입니다.');

    } catch (error) {
      console.error('이메일 중복 체크 오류:', error);
      setEmailStatus('error');
      setEmailMessage('이메일 확인 중 오류가 발생했습니다.');
    }
  };

  // 이메일 확인 버튼 클릭 핸들러
  const handleEmailCheck = (): void => {
    if (email && email.includes('@')) {
      checkEmailAvailability(email);
    } else {
      setEmailStatus('error');
      setEmailMessage('올바른 이메일 형식을 입력해주세요.');
    }
  };

  // 이메일 변경 시 상태 초기화
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // 이메일이 변경되면 검증 상태 초기화
    if (emailStatus !== 'idle') {
      setEmailStatus('idle');
      setEmailMessage('');
    }
    
    // 이메일 변경 시 에러 메시지 초기화
    if (error && error.includes('이메일')) {
      setError('');
    }
  };

  // 일반 이메일 회원가입
  const handleSignup = async (): Promise<void> => {
    setError('');
    setSuccess('');
    
    // 이메일 중복 체크
    if (emailStatus === 'taken') {
      setError('이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인해주세요.');
      return;
    }
    
    if (emailStatus === 'checking') {
      setError('이메일 확인 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    if (emailStatus === 'error') {
      setError('이메일 확인에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    
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
      setIsSigningUp(true);
      
      console.log('=== 프론트엔드 회원가입 시작 ===');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

      // 백엔드 API를 통해 회원가입
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          resident_number: residentNumber
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('회원가입 오류:', result);
        
        // Rate limit 에러 처리
        if (response.status === 429) {
          setError('이메일 전송이 너무 많습니다. 잠시 후 다시 시도해주세요. (1-2분 후)');
        } else {
          setError(result.error || '회원가입 중 오류가 발생했습니다.');
        }
        return;
      }

      if (result.success) {
        setSuccess(result.message || '회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.');
        setTimeout(() => {
          router.replace('/login');
        }, 5000);
      } else {
        setError(result.error || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  // 이벤트 핸들러 타입 정의
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

  // 이메일 상태에 따른 스타일 클래스
  const getEmailInputClass = (): string => {
    const baseClass = "w-full mb-2 p-2 border rounded";
    switch (emailStatus) {
      case 'available':
        return `${baseClass} border-green-500 bg-green-50`;
      case 'taken':
        return `${baseClass} border-red-500 bg-red-50`;
      case 'checking':
        return `${baseClass} border-yellow-500 bg-yellow-50`;
      case 'error':
        return `${baseClass} border-red-500 bg-red-50`;
      default:
        return baseClass;
    }
  };

  // 이메일 상태에 따른 메시지 색상
  const getEmailMessageClass = (): string => {
    switch (emailStatus) {
      case 'available':
        return 'text-green-600 text-sm';
      case 'taken':
        return 'text-red-600 text-sm';
      case 'checking':
        return 'text-yellow-600 text-sm';
      case 'error':
        return 'text-red-600 text-sm';
      default:
        return 'text-gray-600 text-sm';
    }
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
        
        <div className="text-sm text-gray-600 mb-2">
          이메일을 입력하고 확인 버튼을 눌러주세요
        </div>
        
        <input
          className="w-full mb-2 p-2 border rounded"
          placeholder="이름"
          value={name}
          onChange={handleNameChange}
        />
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                className={getEmailInputClass()}
                type="email"
                placeholder="이메일"
                value={email}
                onChange={handleEmailChange}
              />
              {emailStatus === 'checking' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                </div>
              )}
              {emailStatus === 'available' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {emailStatus === 'taken' && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleEmailCheck}
              disabled={!email || emailStatus === 'checking'}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                !email || emailStatus === 'checking'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {emailStatus === 'checking' ? '확인 중...' : '확인'}
            </button>
          </div>
        </div>
        {emailMessage && (
          <div className={getEmailMessageClass()}>
            {emailMessage}
          </div>
        )}
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
          className={`w-full py-2 rounded font-semibold ${
            isSigningUp || emailStatus !== 'available'
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          onClick={handleSignup}
          disabled={isSigningUp || emailStatus !== 'available'}
        >
          {isSigningUp ? '회원가입 중...' : '회원가입'}
        </button>
        {error && (
          <div className="text-red-500 mt-2">
            {error}
            {error.includes('rate limit') && (
              <div className="text-sm mt-1">
                <p>• 다른 이메일 주소로 시도해보세요</p>
                <p>• 1-2분 후 다시 시도해보세요</p>
              </div>
            )}
          </div>
        )}
        
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