'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { apiClient } from '@/lib/apiClient';
import GeneralSignupForm from '@/app/components/auth/GeneralSignupForm';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [name, setName] = useState('');
  const [residentNumber, setResidentNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState('');

  const validateResidentNumber = (number: string): boolean => /^\d{7}$/.test(number);

  const handleEmailCheck = async () => {
    if (!email || !email.includes('@')) {
      setEmailStatus('error');
      setEmailMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setEmailStatus('checking');
    setEmailMessage('이메일 확인 중...');

    try {
      const duplicateResult = await apiClient.checkEmail(email.trim());
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

      const validationResult = await apiClient.validateEmail(email.trim());
      if (!validationResult.success || !validationResult.data?.valid) {
        setEmailStatus('error');
        setEmailMessage(validationResult.data?.message || '유효하지 않은 이메일 주소입니다.');
        return;
      }

      setEmailStatus('available');
      setEmailMessage('사용 가능한 이메일입니다.');
    } catch (error) {
      console.error('이메일 중복 체크 오류:', error);
      setEmailStatus('error');
      setEmailMessage('이메일 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSignup = async () => {
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

    if (!residentNumber || !validateResidentNumber(residentNumber)) {
      setError('주민번호는 7자리 숫자로 입력해주세요.');
      return;
    }

    try {
      setIsSigningUp(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          resident_number: residentNumber,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || '회원가입 중 오류가 발생했습니다.');
        return;
      }

      if (result.success) {
        setSuccess(result.message || '회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        setTimeout(() => router.replace('/login'), 5000);
      } else {
        setError(result.error || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const getEmailInputClass = () => {
    const base = 'w-full mb-2 p-2 border border-gray-300 rounded py-3 focus-within:text-blue-500';
    switch (emailStatus) {
      case 'available': return `${base} border-green-500 bg-green-50`;
      case 'taken':
      case 'error': return `${base} border-red-500 bg-red-50`;
      case 'checking': return `${base} border-yellow-500 bg-yellow-50`;
      default: return base;
    }
  };

  const getEmailMessageClass = () => {
    switch (emailStatus) {
      case 'available': return 'text-green-600 text-sm';
      case 'taken':
      case 'error': return 'text-red-600 text-sm';
      case 'checking': return 'text-yellow-600 text-sm';
      default: return 'text-gray-600 text-sm';
    }
  };

  const handleResidentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setResidentNumber(value.slice(0, 7));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailStatus !== 'idle') {
      setEmailStatus('idle');
      setEmailMessage('');
    }
    if (error.includes('이메일')) setError('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white px-4 mt-16">
      {/* 고정된 로고 영역 */}
      <div className="flex flex-col items-center justify-start mt-20 mb-10">
        <Image src="/images/Tickity.svg" alt="Tickity 로고" width={200} height={60} priority />
        <div className="text-center mt-4">
          <p className="text-lg font-semibold text-gray-900 mb-1">Tickity 회원가입</p>
          <p className="text-sm text-gray-500">한 계정으로 다양한 서비스를 이용하세요.</p>
        </div>
      </div>

      {/* 회원가입 폼 */}
      <div className="flex flex-col items-center flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <GeneralSignupForm
            name={name}
            email={email}
            password={password}
            passwordCheck={passwordCheck}
            residentNumber={residentNumber}
            emailStatus={emailStatus}
            emailMessage={emailMessage}
            error={error}
            isSigningUp={isSigningUp}
            onNameChange={e => setName(e.target.value)}
            onEmailChange={handleEmailChange}
            onPasswordChange={e => setPassword(e.target.value)}
            onPasswordCheckChange={e => setPasswordCheck(e.target.value)}
            onResidentNumberChange={handleResidentNumberChange}
            onEmailCheck={handleEmailCheck}
            onSignup={handleSignup}
            getEmailInputClass={getEmailInputClass}
            getEmailMessageClass={getEmailMessageClass}
          />

          {success && <div className="text-green-600 mt-4 text-center">{success}</div>}
          {error && <div className="text-red-500 mt-4 text-center">{error}</div>}

          <div className="mt-6 text-center mb-25">
            <span className="text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-blue-600 hover:underline cursor-pointer">
              로그인하기
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
