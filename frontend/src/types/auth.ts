// 회원가입 요청 타입
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  resident_number: string;  // ✅ 이 줄 추가
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 사용자 메타데이터 타입
export interface UserMetadata {
  name?: string;
  full_name?: string;
  resident_number?: string;
}

// 사용자 정보 타입
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  residentNumber: string;
  walletAddress: string;
  createdAt: string;
  hasEmbedding?: boolean; // ✅ 추가
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
  hasEmbedding?: boolean; // ✅ 추가
}

// 사용자 정보 응답 타입
export interface UserResponse {
  user: UserInfo;
} 