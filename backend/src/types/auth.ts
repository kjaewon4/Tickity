// 회원가입 요청 타입
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  resident_number: string;  // ✅ 이 줄 추가
  embedding?: number[];     // ✅ embedding도 같이 정의 (optional) 
  temp_id?: string;       // 👈 추가
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 사용자 정보 타입
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  residentNumber: string;
  walletAddress: string;
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 인증 응답 타입
export interface AuthResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
} 