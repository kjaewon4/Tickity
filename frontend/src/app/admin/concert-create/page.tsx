'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import AuthGuard from '@/app/components/AuthGuard';
import ConcertBasicSection from '@/app/components/ConcertBasicSection';
import ConcertBookingSection from '@/app/components/ConcertBookingSection';
import ConcertSellerSection from '@/app/components/ConcertSellerSection';

interface Venue {
  id: string;
  name: string;
  address: string;
  capacity?: number;
}

interface SeatGrade {
  id: string;
  grade_name: string;
  default_price: number;
  venue_id: string;
}

interface SeatPrice {
  seat_grade_id: string;
  price: number;
}

interface ConcertFormData {
  title: string;
  start_date: string;
  start_time: string;
  main_performer: string;
  organizer: string;
  promoter: string;
  customer_service: string;
  running_time: string;
  age_rating: string;
  booking_fee: number | undefined;
  shipping_note: string;
  valid_from: string;
  valid_to: string;
  seller_name: string;
  seller_rep: string;
  seller_reg_no: string;
  seller_email: string;
  seller_contact: string;
  seller_address: string;
  category: string;
  venue_id?: string;
  poster_url?: string;
  round: number;
  ticket_open_at?: string;
}

export default function ConcertCreatePage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [seatGrades, setSeatGrades] = useState<SeatGrade[]>([]);
  const [seatPrices, setSeatPrices] = useState<SeatPrice[]>([]);
  const [seatGradesLoading, setSeatGradesLoading] = useState(false);
  
  // 파일 업로드 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // 날짜 검증 상태
  const [dateValidationError, setDateValidationError] = useState<string>('');
  
  // 오늘 날짜 (최소 선택 가능 날짜)
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<ConcertFormData>({
    title: '',
    start_date: today,
    start_time: '19:00',
    main_performer: '',
    organizer: '',
    promoter: '',
    customer_service: '',
    running_time: '',
    age_rating: '만 14세 이상',
    booking_fee: undefined,
    shipping_note: '',
    valid_from: '',
    valid_to: '',
    seller_name: '',
    seller_rep: '',
    seller_reg_no: '',
    seller_email: '',
    seller_contact: '',
    seller_address: '',
    category: '',
    venue_id: '',
    poster_url: '',
    round: 1,
    ticket_open_at: '09:00'
  });

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 컴포넌트 마운트 시 공연장 목록 로드
  useEffect(() => {
    loadVenues();
  }, []);

  // 날짜 변경 시 실시간 검증
  useEffect(() => {
    if (formData.valid_from && formData.valid_to && formData.start_date) {
      const validationResult = validateDatesWithoutAlert();
      if (!validationResult.isValid) {
        setDateValidationError(validationResult.errorMessage || '');
      } else {
        setDateValidationError('');
      }
    } else {
      setDateValidationError('');
    }
  }, [formData.valid_from, formData.valid_to, formData.start_date]);

  // 공연장 목록 로드
  const loadVenues = async () => {
    try {
      setVenuesLoading(true);
      const response = await apiClient.get('/venues');
      
      if (response && response.success) {
        setVenues((response.data as Venue[]) || []);
      } else {
        console.error('공연장 목록 조회 실패:', response?.error || 'No response data');
        setVenues([]);
      }
    } catch (error) {
      console.error('공연장 API 호출 실패:', error);
      setVenues([]);
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleVenueChange = (venueId: string) => {
    loadSeatGrades(venueId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기가 5MB를 초과합니다.');
        return;
      }

      // 파일 타입 체크
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG, GIF 파일만 업로드 가능합니다.');
        return;
      }

      setSelectedFile(file);
      
      // 미리보기 URL 생성
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
    }
  };

  const uploadPosterImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    try {
      setUploadLoading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('poster', selectedFile); // 백엔드에서 기대하는 필드명
      uploadFormData.append('category', formData.category || '기타'); // 카테고리가 없으면 기본값 사용

      console.log('포스터 업로드 요청:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        category: formData.category || '기타'
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/poster`, {
        method: 'POST',
        body: uploadFormData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`포스터 업로드 실패: ${errorMessage}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`포스터 업로드 실패: ${result.error || '알 수 없는 오류'}`);
      }
      
      if (!result.data?.url) {
        throw new Error('포스터 업로드 실패: 업로드된 파일 URL을 받지 못했습니다.');
      }
      
      console.log('포스터 업로드 성공:', result.data);
      return result.data.url;
    } catch (error) {
      console.error('포스터 업로드 오류:', error);
      throw error; // 에러를 다시 던져서 handleSubmit에서 처리하도록 함
    } finally {
      setUploadLoading(false);
    }
  };

  const validateDatesWithoutAlert = (): { isValid: boolean; errorMessage?: string } => {
    if (formData.valid_from && formData.valid_to && formData.start_date) {
      const bookingStart = new Date(formData.valid_from);
      const bookingEnd = new Date(formData.valid_to);
      const performanceDate = new Date(formData.start_date);
      
      // 1. 기본 날짜 순서 검증
      if (bookingStart >= bookingEnd) {
        return { isValid: false, errorMessage: '예매 시작일이 종료일보다 뒤에 있습니다.' };
      }
      
      if (bookingEnd >= performanceDate) {
        return { isValid: false, errorMessage: '예매 종료일이 공연 날짜보다 뒤에 있습니다.' };
      }
      
      // 2. 취소정책 조건 검증
      // 현재 취소정책: 예매 후 7일 이내 무료, 예매 후 8일~관람일 10일전까지 유료
      // "예매 후 8일~관람일 10일전까지" 구간이 존재하려면: 예매 종료일 + 8일 ≤ 공연일 - 10일
      // 즉, 예매 종료일 ≤ 공연일 - 18일 (18일 이상 간격 필요)
      
      const eightDaysAfterBookingEnd = new Date(bookingEnd);
      eightDaysAfterBookingEnd.setDate(eightDaysAfterBookingEnd.getDate() + 8);
      
      const tenDaysBeforePerformance = new Date(performanceDate);
      tenDaysBeforePerformance.setDate(tenDaysBeforePerformance.getDate() - 10);
      
      // 예매 종료일로부터 8일 후가 공연일 10일 전보다 뒤에 있으면 문제
      if (eightDaysAfterBookingEnd > tenDaysBeforePerformance) {
        const actualGap = Math.ceil((performanceDate.getTime() - bookingEnd.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          isValid: false, 
          errorMessage: `취소정책 조건을 만족하지 않습니다. 예매 종료일과 공연 날짜 사이에 최소 18일의 간격이 필요합니다. (현재: ${actualGap}일) "예매 후 8일~관람일 10일전까지" 수수료 구간이 존재하지 않습니다.`
        };
      }
      
      // 3. 최소 예매 기간 검증 (최소 1일은 예매 기간이 있어야 함)
      const bookingPeriodMs = bookingEnd.getTime() - bookingStart.getTime();
      const bookingPeriodDays = Math.ceil(bookingPeriodMs / (1000 * 60 * 60 * 24));
      
      if (bookingPeriodDays < 1) {
        return { isValid: false, errorMessage: '예매 기간이 최소 1일 이상이어야 합니다.' };
      }
    }
    
    return { isValid: true };
  };

  const validateDates = () => {
    const result = validateDatesWithoutAlert();
    if (!result.isValid) {
      alert(result.errorMessage);
      return false;
    }
    return true;
  };

  const loadSeatGrades = async (venueId: string) => {
    try {
      setSeatGradesLoading(true);
      console.log('좌석 등급 로드 시작 - venue_id:', venueId);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/seat-grades?venue_id=${venueId}`);
      
      const response = await apiClient.get(`/seat-grades?venue_id=${venueId}`);
      
      console.log('좌석 등급 API 응답:', response);
      
      if (response && response.success) {
        const grades = response.data as SeatGrade[];
        console.log('조회된 좌석 등급:', grades);
        setSeatGrades(grades);
        
        // 기본 가격으로 초기화
        const initialPrices = grades.map(grade => ({
          seat_grade_id: grade.id,
          price: grade.default_price
        }));
        setSeatPrices(initialPrices);
        console.log('초기화된 좌석 가격:', initialPrices);
      } else {
        console.log('좌석 등급 조회 실패 또는 빈 응답:', response);
        setSeatGrades([]);
        setSeatPrices([]);
      }
    } catch (error) {
      console.error('좌석 등급 로드 실패:', error);
      setSeatGrades([]);
      setSeatPrices([]);
    } finally {
      setSeatGradesLoading(false);
    }
  };

  const handleSeatPriceChange = (seatGradeId: string, price: number) => {
    setSeatPrices(prev => 
      prev.map(item => 
        item.seat_grade_id === seatGradeId 
          ? { ...item, price }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates()) {
      return;
    }

    try {
      setLoading(true);
      
      // 포스터 업로드 처리 - 선택된 파일이 있으면 반드시 업로드 성공해야 함
      let posterUrl = null;
      if (selectedFile) {
        try {
          posterUrl = await uploadPosterImage();
          console.log('포스터 업로드 성공:', posterUrl);
        } catch (uploadError: any) {
          // 포스터 업로드 실패 시 사용자에게 선택권 제공
          const continueWithoutPoster = confirm(
            `포스터 업로드에 실패했습니다.\n오류: ${uploadError.message}\n\n포스터 없이 콘서트를 등록하시겠습니까?\n\n• 확인: 포스터 없이 등록\n• 취소: 등록 중단`
          );
          
          if (!continueWithoutPoster) {
            alert('콘서트 등록이 취소되었습니다. 포스터 문제를 해결한 후 다시 시도해주세요.');
            return;
          }
          
          // 포스터 없이 진행하기로 선택한 경우
          console.log('사용자가 포스터 없이 진행하기로 선택');
          posterUrl = null;
        }
      }

      // 날짜 문자열 안전 변환 함수
      const safeToISOString = (dateStr: string | undefined, fallback?: string): string => {
        if (!dateStr) {
          return fallback || new Date().toISOString();
        }
        try {
          return new Date(dateStr).toISOString();
        } catch {
          return fallback || new Date().toISOString();
        }
      };

      const safeToDateString = (dateStr: string | undefined, fallback?: string): string => {
        if (!dateStr) {
          return fallback || new Date().toISOString().split('T')[0];
        }
        return dateStr;
      };

      // 제출 데이터 구성
      const processedData = {
        title: formData.title,
        start_date: formData.start_date,
        start_time: formData.start_time,
        main_performer: formData.main_performer,
        organizer: formData.organizer,
        promoter: formData.promoter,
        customer_service: formData.customer_service,
        running_time: formData.running_time,
        age_rating: formData.age_rating,
        booking_fee: formData.booking_fee || 0,
        shipping_note: formData.shipping_note,
        valid_from: safeToDateString(formData.valid_from),
        valid_to: safeToDateString(formData.valid_to, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        seller_name: formData.seller_name,
        seller_rep: formData.seller_rep,
        seller_reg_no: formData.seller_reg_no,
        seller_email: formData.seller_email,
        seller_contact: formData.seller_contact,
        seller_address: formData.seller_address,
        category: formData.category,
        
        // 기본값이 있는 필수 필드들
        mobile_ticket_supported: true,
        id_doc_required: true,
        round: formData.round || 1,
        
        // 선택적 필드들
        poster_url: posterUrl || null,
        venue_id: formData.venue_id || null,
        ticket_open_at: formData.valid_from 
          ? `${formData.valid_from}T${formData.ticket_open_at || '09:00'}`
          : safeToISOString(new Date().toISOString().split('T')[0] + 'T09:00'),
        android_min_version: "7.0",
        ios_min_version: "12.0",
      };

      console.log('콘서트 등록 요청 데이터:', processedData);
      const response = await apiClient.post('/concerts', processedData);

      if (response.success) {
        const concertId = (response.data as any).id;
        
        // 기본 가격과 다른 경우에만 저장
        const changedPrices = seatPrices.filter(seatPrice => {
          const seatGrade = seatGrades.find(grade => grade.id === seatPrice.seat_grade_id);
          return seatGrade && seatPrice.price !== seatGrade.default_price;
        });

        if (changedPrices.length > 0) {
          try {
            const priceResponse = await apiClient.post(`/concerts/${concertId}/seat-prices`, {
              seatPrices: changedPrices
            });
            
            if (!priceResponse.success) {
              console.warn('좌석 가격 저장 실패:', priceResponse.error);
            }
          } catch (priceError) {
            console.warn('좌석 가격 저장 중 오류:', priceError);
          }
        }
        
        const successMessage = posterUrl 
          ? '콘서트가 포스터와 함께 성공적으로 등록되었습니다!'
          : '콘서트가 성공적으로 등록되었습니다! (포스터는 나중에 추가할 수 있습니다)';
        
        alert(successMessage);
        router.push('/admin/concerts');
      } else {
        alert(`등록 실패: ${response.error}`);
      }
    } catch (error: any) {
      console.error('콘서트 등록 실패:', error);
      alert(`등록 실패: ${error.response?.data?.error || error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">콘서트 등록</h1>
              <p className="mt-1 text-sm text-gray-600">새로운 콘서트를 등록합니다</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <ConcertBasicSection
                formData={formData}
                venues={venues}
                venuesLoading={venuesLoading}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                uploadLoading={uploadLoading}
                onInputChange={handleInputChange}
                onFileSelect={handleFileSelect}
                onVenueChange={handleVenueChange}
              />

              <ConcertBookingSection
                formData={formData}
                seatGrades={seatGrades}
                seatPrices={seatPrices}
                seatGradesLoading={seatGradesLoading}
                dateValidationError={dateValidationError}
                onInputChange={handleInputChange}
                onSeatPriceChange={handleSeatPriceChange}
              />

              <ConcertSellerSection
                formData={formData}
                onInputChange={handleInputChange}
              />

              {/* 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '등록 중...' : '콘서트 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 