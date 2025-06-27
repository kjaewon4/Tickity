// 환경별 설정 관리
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  // 기본값 설정
  return {
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://myserver.ngrok.pro',
    BACKEND_URL: process.env.BACKEND_URL || 'https://myserver2.ngrok.pro',
    NODE_ENV: process.env.NODE_ENV || 'production'
  };
};

// 요청에 따른 동적 URL 설정
export const getDynamicConfig = (req?: any) => {
  if (!req) {
    return getEnvironmentConfig();
  }

  // Origin 헤더 확인
  const origin = req.headers?.origin || req.headers?.referer;
  const host = req.headers?.host;

  // localhost 감지
  const isLocalhost = origin?.includes('localhost') || 
                     origin?.includes('127.0.0.1') || 
                     host?.includes('localhost') || 
                     host?.includes('127.0.0.1');

  if (isLocalhost) {
    return {
      FRONTEND_URL: 'http://localhost:3000',
      BACKEND_URL: 'http://localhost:4000',
      NODE_ENV: 'development'
    };
  }

  // ngrok 감지
  const isNgrok = origin?.includes('ngrok') || host?.includes('ngrok');
  if (isNgrok) {
    return {
      FRONTEND_URL: 'https://myserver.ngrok.pro',
      BACKEND_URL: 'https://myserver2.ngrok.pro',
      NODE_ENV: 'production'
    };
  }

  // 기본값
  return getEnvironmentConfig();
};

// 전역 설정 객체 (기본값)
export const config = getEnvironmentConfig(); 