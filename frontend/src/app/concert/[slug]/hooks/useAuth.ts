import { useState, useEffect } from 'react';

interface UseAuthReturn {
  isLoggedIn: boolean;
  userId: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (accessToken) {
        try {
          // API를 통해 사용자 정보 조회
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.user) {
              setIsLoggedIn(true);
              setUserId(data.data.user.id);
              console.log('사용자 로그인 상태 확인됨:', data.data.user.id);
            } else {
              // 토큰이 유효하지 않은 경우 제거
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              setIsLoggedIn(false);
              setUserId(null);
              console.log('유효하지 않은 토큰, 로그아웃 처리');
            }
          } else {
            // API 호출 실패 시 토큰 제거
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsLoggedIn(false);
            setUserId(null);
            console.log('API 호출 실패, 로그아웃 처리');
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          setUserId(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        console.log('로그인 상태 없음');
      }
    };

    checkLoginStatus();
  }, []);

  return {
    isLoggedIn,
    userId
  };
}; 