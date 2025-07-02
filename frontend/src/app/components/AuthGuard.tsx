'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: ReactNode;
  adminOnly?: boolean;
}

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    const checkAuthAndPermission = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setAuthState({ isLoggedIn: false, isAdmin: false, loading: false });
          return;
        }

        // 사용자 정보 조회 및 권한 확인
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setAuthState({ isLoggedIn: false, isAdmin: false, loading: false });
          return;
        }

        const userData = await userResponse.json();
        
        if (userData.success && userData.data?.user) {
          const isLoggedIn = true;
          
          // 관리자 권한 확인
          const adminAddress = '0x030fd25c452078627Db888f8B22aF1c0fEcDCf97';
          const userWalletAddress = userData.data.user.walletAddress;
          const isAdmin = userWalletAddress?.toLowerCase() === adminAddress.toLowerCase();
          
          setAuthState({ isLoggedIn, isAdmin, loading: false });
        } else {
          setAuthState({ isLoggedIn: false, isAdmin: false, loading: false });
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        setAuthState({ isLoggedIn: false, isAdmin: false, loading: false });
      }
    };

    checkAuthAndPermission();
  }, []);

  // 로딩 중
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {adminOnly ? '관리자 권한을 확인하는 중...' : '로그인 상태를 확인하는 중...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 안됨
  if (!authState.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">
              {adminOnly ? '관리자 페이지에 접근하려면 로그인해주세요.' : '이 페이지에 접근하려면 로그인해주세요.'}
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 관리자 권한 체크가 필요한데 권한이 없음
  if (adminOnly && !authState.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h1>
            <p className="text-gray-600 mb-6">관리자 권한이 필요한 페이지입니다.</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 권한 확인 완료 - children 렌더링
  return <>{children}</>;
} 