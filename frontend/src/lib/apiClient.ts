import { 
  SignupRequest, 
  LoginRequest, 
  ApiResponse, 
  AuthResponse,
  UserInfo,
  UserResponse
} from '../types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // 로컬 스토리지에서 토큰 가져오기
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, error: text || 'API 응답이 JSON이 아닙니다.' };
      }
      if (!response.ok) {
        throw new Error(data.error || 'API 요청 실패');
      }
      return data;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 회원가입
  async signup(userData: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // 로그인
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // 로그아웃
  async logout(token: string): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // 사용자 정보 조회 (토큰 자동 포함)
  async getUser(): Promise<ApiResponse<UserResponse>> {
    return this.request<UserResponse>('/auth/user', {
      method: 'GET',
    });
  }

  // 사용자 정보 조회 (토큰으로)
  async getUserWithToken(token: string): Promise<ApiResponse<UserResponse>> {
    return this.request<UserResponse>('/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // 사용자 정보 업데이트
  async updateUser(userData: { name: string; resident_number: string }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/auth/user', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Google OAuth 사용자 생성
  async createGoogleUser(userData: { name: string; resident_number: string }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('/auth/google-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // 이메일 중복 체크
  async checkEmail(email: string): Promise<ApiResponse<{ exists: boolean }>> {
    return this.request<{ exists: boolean }>(`/auth/check-email/${email}`, {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 