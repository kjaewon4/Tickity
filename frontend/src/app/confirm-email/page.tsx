'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || type !== 'signup') {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
      return;
    }

    // 백엔드로 인증 요청
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/confirm-email?token_hash=${token_hash}&type=${type}`)
      .then(response => {
        if (response.ok) {
          setStatus('success');
          setMessage('이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.');
          setTimeout(() => {
            router.push('/login?message=email_confirmed');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('이메일 인증에 실패했습니다.');
        }
      })
      .catch(error => {
        console.error('이메일 인증 오류:', error);
        setStatus('error');
        setMessage('이메일 인증 중 오류가 발생했습니다.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            이메일 인증
          </h2>
        </div>
        
        <div className="mt-8 space-y-6">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">이메일 인증을 처리하고 있습니다...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-green-600">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-red-600">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                로그인 페이지로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 