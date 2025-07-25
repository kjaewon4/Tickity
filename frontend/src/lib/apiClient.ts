import { TicketMintResult } from '../types/ticket';
import { UserTicket } from '@/types/ticket';

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
// 사용자 티켓 목록 조회 (userId 기반)
async getUserTickets(userId: string): Promise<ApiResponse<{ tickets: UserTicket[] }>> {
  return this.request<{ tickets: UserTicket[] }>(`/users/tickets/${userId}`, {
    method: 'GET',
  });
}

// 사용자 대시보드 조회
async getUserDashboard(userId: string): Promise<ApiResponse<any>> {
  return this.request<any>(`/users/dashboard/${userId}`, {
    method: 'GET',
  });
}

// 블록체인 민팅 티켓 조회 (NFT 티켓 목록용)
async getMintedTickets(userId: string): Promise<ApiResponse<TicketMintResult[]>> {
  return this.request(`/tickets/minted/${userId}`, {
    method: 'GET',
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

  // HTTP 메서드들
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  // 이메일 유효성 검증
  async validateEmail(email: string): Promise<ApiResponse<{ valid: boolean; message?: string }>> {
    return this.request<{ valid: boolean; message?: string }>('/auth/validate-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
    // 티켓 취소
  async cancelTicket(seatId: string, ticketId: string, tokenId: number): Promise<ApiResponse<{ reopenTime: number }>> {
    return this.request<{ reopenTime: number }>('/tickets/cancel', {
      method: 'POST',
      body: JSON.stringify({ seatId, ticketId, tokenId }),
    });
  }

    // 주민등록번호 복호화 API 호출
  async getResidentNumber(userId: string): Promise<ApiResponse<{ residentNumber: string }>> {
    return this.request<{ residentNumber: string }>(`/users/resident-number/${userId}`, {
      method: 'GET',
    });
  }

  // QR 코드 데이터 조회
  async getQRData(ticketId: string): Promise<ApiResponse<{
    tokenId: string;
    contractAddress: string;
    ticketId: string;
    qrString: string;
  }>> {
    return this.request<{
      tokenId: string;
      contractAddress: string;
      ticketId: string;
      qrString: string;
    }>(`/tickets/qr-data/${ticketId}`, {
      method: 'GET',
    });
  }

  // QR 코드 인증
  async verifyQRCode(qrData: string): Promise<ApiResponse<{
    isValid: boolean;
    ticketInfo: any;
    verification: {
      ownershipValid: boolean;
      usageStatusValid: boolean;
      faceVerificationValid: boolean;
      cancellationStatusValid: boolean;
      errors: string[];
    };
  }>> {
    return this.request<{
      isValid: boolean;
      ticketInfo: any;
      verification: {
        ownershipValid: boolean;
        usageStatusValid: boolean;
        faceVerificationValid: boolean;
        cancellationStatusValid: boolean;
        errors: string[];
      };
    }>('/tickets/verify-qr', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }
}


const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
export { apiClient }; 