'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

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
  date: string;
  main_performer: string;
  organizer: string;
  promoter: string;
  customer_service: string;
  running_time: string;
  age_rating: string;
  booking_fee: number;
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
  start_date?: string;
  start_time?: string;
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
  
  // 관리자 권한 체크 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 오늘 날짜 (최소 선택 가능 날짜)
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<ConcertFormData>({
    title: '',
    date: `${new Date().toISOString().split('T')[0]}T19:00`, // 오늘 날짜 + 19:00 기본값
    main_performer: '',
    organizer: '',
    promoter: '',
    customer_service: '',
    running_time: '',
    age_rating: '만 14세 이상', // 고정값
    booking_fee: 0,
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
    start_date: '',
    start_time: '',
    round: 1,
    ticket_open_at: '09:00' // 기본 오픈 시간
  });

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // 로그인 상태 및 권한 확인
  useEffect(() => {
    const checkAuthAndPermission = async () => {
      try {
        setAuthLoading(true);
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }

        // 사용자 정보 조회 및 권한 확인을 한 번에 처리
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsLoggedIn(false);
          setIsAdmin(false);
          return;
        }

        const userData = await userResponse.json();
        
        if (userData.success && userData.data?.user) {
          setIsLoggedIn(true);
          
          // 관리자 권한 확인
          const adminAddress = '0x030fd25c452078627Db888f8B22aF1c0fEcDCf97';
          const userWalletAddress = userData.data.user.walletAddress;
          
          if (userWalletAddress?.toLowerCase() === adminAddress.toLowerCase()) {
            setIsAdmin(true);
            // 권한이 있으면 바로 공연장 목록 로드
            loadVenues();
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthAndPermission();
  }, []);

  // 공연장 목록 로드 (권한이 있을 때만)
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
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // venue_id가 변경되면 좌석 등급 정보 로드
    if (name === 'venue_id' && value) {
      loadSeatGrades(value);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하만 가능합니다.');
      return;
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 기존 미리보기 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    
    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 파일 업로드
  const uploadPosterImage = async (): Promise<string | null> => {
    if (!selectedFile || !formData.category) {
      return null;
    }

    try {
      setUploadLoading(true);
      
      const formDataForUpload = new FormData();
      formDataForUpload.append('poster', selectedFile);
      formDataForUpload.append('category', formData.category);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/poster`, {
        method: 'POST',
        body: formDataForUpload,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success && result.data?.url) {
        return result.data.url;
      } else {
        throw new Error(result.error || '업로드 실패');
      }
    } catch (error) {
      console.error('포스터 업로드 오류:', error);
      alert('포스터 업로드에 실패했습니다.');
      return null;
    } finally {
      setUploadLoading(false);
    }
  };

  // 날짜 유효성 검사
  const validateDates = () => {
    const concertDate = new Date(formData.date);
    const validFromDate = new Date(formData.valid_from);
    const validToDate = new Date(formData.valid_to);

    if (concertDate < validFromDate) {
      alert('공연 날짜는 예매 시작일보다 빠를 수 없습니다.');
      return false;
    }

    if (validFromDate > validToDate) {
      alert('예매 시작일은 예매 종료일보다 늦을 수 없습니다.');
      return false;
    }

    return true;
  };

  // 좌석 등급 정보 로드
  const loadSeatGrades = async (venueId: string) => {
    try {
      setSeatGradesLoading(true);
      const response = await apiClient.get(`/venues/${venueId}/seat-grades`);
      
      if (response && response.success) {
        const grades = (response.data as SeatGrade[]) || [];
        setSeatGrades(grades);
        
        // 기본 가격으로 초기화
        const defaultPrices = grades.map((grade: SeatGrade) => ({
          seat_grade_id: grade.id,
          price: grade.default_price
        }));
        setSeatPrices(defaultPrices);
      } else {
        console.error('좌석 등급 조회 실패:', response?.error);
        setSeatGrades([]);
        setSeatPrices([]);
      }
    } catch (error) {
      console.error('좌석 등급 API 호출 실패:', error);
      setSeatGrades([]);
      setSeatPrices([]);
    } finally {
      setSeatGradesLoading(false);
    }
  };

  // 좌석 가격 변경 핸들러
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
    
    // 날짜 유효성 검사
    if (!validateDates()) {
      return;
    }

    // 카테고리가 선택되지 않았는데 파일이 선택된 경우
    if (selectedFile && !formData.category) {
      alert('포스터 이미지를 업로드하려면 카테고리를 먼저 선택해주세요.');
      return;
    }
    
    setLoading(true);

    try {
      // 포스터 이미지 업로드 처리
      let posterUrl: string | undefined = formData.poster_url;
      if (selectedFile) {
        const uploadedUrl = await uploadPosterImage();
        if (!uploadedUrl) {
          // 업로드 실패 시 중단
          return;
        }
        posterUrl = uploadedUrl;
      }

      // 날짜 유효성 검사 및 안전한 변환 함수
      const safeToISOString = (dateStr: string | undefined, fallback?: string): string => {
        if (!dateStr || dateStr.trim() === '') {
          return fallback || new Date().toISOString();
        }
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date: ${dateStr}, using fallback`);
          return fallback || new Date().toISOString();
        }
        
        return date.toISOString();
      };

      const safeToDateString = (dateStr: string | undefined, fallback?: string): string => {
        if (!dateStr || dateStr.trim() === '') {
          return fallback || new Date().toISOString().split('T')[0];
        }
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date: ${dateStr}, using fallback`);
          return fallback || new Date().toISOString().split('T')[0];
        }
        
        return date.toISOString().split('T')[0];
      };

      // 실제 데이터베이스 스키마에 맞춘 데이터 구성
      const processedData = {
        // 기본 필수 필드들
        title: formData.title,
        date: safeToISOString(formData.date),
        main_performer: formData.main_performer,
        organizer: formData.organizer,
        promoter: formData.promoter,
        customer_service: formData.customer_service,
        running_time: formData.running_time,
        age_rating: formData.age_rating,
        booking_fee: formData.booking_fee,
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
        start_date: safeToDateString(formData.start_date),
        start_time: formData.start_time || '19:00',
        // 티켓 오픈은 예매 시작일에 사용자가 선택한 시간으로 설정
        ticket_open_at: formData.valid_from 
          ? `${formData.valid_from}T${formData.ticket_open_at || '09:00'}`
          : safeToISOString(new Date().toISOString().split('T')[0] + 'T09:00'),
        android_min_version: "7.0",
        ios_min_version: "12.0",
      };

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
        
        alert('콘서트가 성공적으로 등록되었습니다!');
        router.push('/admin/concerts'); // 관리자 콘서트 목록 페이지로 이동
      } else {
        alert(`등록 실패: ${response.error}`);
      }
    } catch (error: any) {
      console.error('콘서트 등록 실패:', error);
      alert(`등록 실패: ${error.response?.data?.error || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 권한 체크 중 */}
        {authLoading && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">관리자 권한을 확인하는 중...</p>
          </div>
        )}

        {/* 로그인 안됨 */}
        {!authLoading && !isLoggedIn && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-6">관리자 페이지에 접근하려면 로그인해주세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              로그인하기
            </button>
          </div>
        )}

        {/* 로그인됨 but 관리자 권한 없음 */}
        {!authLoading && isLoggedIn && !isAdmin && (
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
        )}

        {/* 권한 있음 - 폼 표시 */}
        {!authLoading && isLoggedIn && isAdmin && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">콘서트 등록</h1>
              <p className="mt-1 text-sm text-gray-600">새로운 콘서트를 등록합니다</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    콘서트 제목 *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="main_performer" className="block text-sm font-medium text-gray-700 mb-2">
                    메인 아티스트 *
                  </label>
                  <input
                    type="text"
                    id="main_performer"
                    name="main_performer"
                    required
                    value={formData.main_performer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    공연 날짜 *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    min={today}
                    value={formData.date.split('T')[0]} // 날짜 부분만 표시
                    onChange={(e) => {
                      // 날짜가 변경되면 시간은 19:00으로 기본 설정
                      const newDateTime = `${e.target.value}T19:00`;
                      setFormData(prev => ({ ...prev, date: newDateTime }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    공연 시간 *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    required
                    value={formData.date.split('T')[1] || '19:00'} // 시간 부분만 표시
                    onChange={(e) => {
                      // 시간이 변경되면 날짜와 결합
                      const dateOnly = formData.date.split('T')[0] || new Date().toISOString().split('T')[0];
                      const newDateTime = `${dateOnly}T${e.target.value}`;
                      setFormData(prev => ({ ...prev, date: newDateTime }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700 mb-2">
                    공연장 * {venuesLoading && <span className="text-sm text-gray-500">(로딩 중...)</span>}
                  </label>
                  <select
                    id="venue_id"
                    name="venue_id"
                    required
                    value={formData.venue_id}
                    onChange={handleInputChange}
                    disabled={venuesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">공연장을 선택하세요</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} ({venue.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    <option value="여자아이돌">여자아이돌</option>
                    <option value="남자아이돌">남자아이돌</option>
                    <option value="솔로 가수">솔로 가수</option>
                    <option value="내한공연">내한공연</option>
                    <option value="랩/힙합">랩/힙합</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-2">
                    주최 *
                  </label>
                  <input
                    type="text"
                    id="organizer"
                    name="organizer"
                    required
                    value={formData.organizer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="promoter" className="block text-sm font-medium text-gray-700 mb-2">
                    주관 *
                  </label>
                  <input
                    type="text"
                    id="promoter"
                    name="promoter"
                    required
                    value={formData.promoter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="running_time" className="block text-sm font-medium text-gray-700 mb-2">
                    공연 시간 *
                  </label>
                  <input
                    type="text"
                    id="running_time"
                    name="running_time"
                    required
                    placeholder="예: 120분"
                    value={formData.running_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="customer_service" className="block text-sm font-medium text-gray-700 mb-2">
                    고객센터 *
                  </label>
                  <input
                    type="text"
                    id="customer_service"
                    name="customer_service"
                    required
                    placeholder="예: 02-1234-5678"
                    value={formData.customer_service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="booking_fee" className="block text-sm font-medium text-gray-700 mb-2">
                    예매 수수료 *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="booking_fee"
                      name="booking_fee"
                      required
                      min="0"
                      step="100"
                      value={formData.booking_fee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-2">
                    회차 *
                  </label>
                  <input
                    type="number"
                    id="round"
                    name="round"
                    required
                    min="1"
                    value={formData.round}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="poster" className="block text-sm font-medium text-gray-700 mb-2">
                    포스터 이미지 *
                  </label>
                  <div className="space-y-4">
                    {/* 파일 선택 */}
                    <input
                      type="file"
                      id="poster"
                      name="poster"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* 카테고리 미선택 시 경고 */}
                    {selectedFile && !formData.category && (
                      <p className="text-sm text-amber-600">
                        ⚠️ 포스터를 업로드하려면 카테고리를 먼저 선택해주세요.
                      </p>
                    )}
                    
                    {/* 업로드 진행 중 */}
                    {uploadLoading && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">포스터 업로드 중...</span>
                      </div>
                    )}
                    
                    {/* 미리보기 */}
                    {previewUrl && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
                        <img 
                          src={previewUrl} 
                          alt="포스터 미리보기" 
                          className="max-w-full h-48 object-cover rounded-md"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      • 이미지 파일만 업로드 가능 (JPG, PNG, GIF 등)<br/>
                      • 최대 파일 크기: 5MB<br/>
                      • 카테고리별로 자동 분류: 남자아이돌(boy_group), 여자아이돌(girl_group), 내한공연(overseas), 랩/힙합(rap_hiphop), 솔로 가수(solo)
                    </p>
                  </div>
                </div>
              </div>

              {/* 예매 기간 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">예매 기간</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-2">
                      예매 시작일 *
                    </label>
                    <input
                      type="date"
                      id="valid_from"
                      name="valid_from"
                      required
                      min={today}
                      value={formData.valid_from}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700 mb-2">
                      예매 종료일 *
                    </label>
                    <input
                      type="date"
                      id="valid_to"
                      name="valid_to"
                      required
                      min={formData.valid_from || today}
                      value={formData.valid_to}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="ticket_open_at" className="block text-sm font-medium text-gray-700 mb-2">
                      티켓 오픈 시간 *
                    </label>
                    <input
                      type="time"
                      id="ticket_open_at"
                      name="ticket_open_at"
                      required
                      value={formData.ticket_open_at}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 판매자 정보 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">판매자 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="seller_name" className="block text-sm font-medium text-gray-700 mb-2">
                      판매자명 *
                    </label>
                    <input
                      type="text"
                      id="seller_name"
                      name="seller_name"
                      required
                      value={formData.seller_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="seller_rep" className="block text-sm font-medium text-gray-700 mb-2">
                      대표자 *
                    </label>
                    <input
                      type="text"
                      id="seller_rep"
                      name="seller_rep"
                      required
                      value={formData.seller_rep}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="seller_reg_no" className="block text-sm font-medium text-gray-700 mb-2">
                      사업자등록번호 *
                    </label>
                    <input
                      type="text"
                      id="seller_reg_no"
                      name="seller_reg_no"
                      required
                      placeholder="예: 123-45-67890"
                      value={formData.seller_reg_no}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="seller_email" className="block text-sm font-medium text-gray-700 mb-2">
                      판매자 이메일 *
                    </label>
                    <input
                      type="email"
                      id="seller_email"
                      name="seller_email"
                      required
                      value={formData.seller_email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="seller_contact" className="block text-sm font-medium text-gray-700 mb-2">
                      판매자 전화번호 *
                    </label>
                    <input
                      type="tel"
                      id="seller_contact"
                      name="seller_contact"
                      required
                      placeholder="예: 02-1234-5678"
                      value={formData.seller_contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="seller_address" className="block text-sm font-medium text-gray-700 mb-2">
                      판매자 주소 *
                    </label>
                    <input
                      type="text"
                      id="seller_address"
                      name="seller_address"
                      required
                      value={formData.seller_address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 좌석 가격 설정 */}
              {formData.venue_id && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">좌석 가격 설정</h3>
                  
                  {seatGradesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-500">좌석 등급 정보를 불러오는 중...</p>
                    </div>
                  ) : seatGrades.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {seatGrades.map((grade) => {
                        const currentPrice = seatPrices.find(p => p.seat_grade_id === grade.id)?.price || grade.default_price;
                        
                        return (
                          <div key={grade.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-900">{grade.grade_name}</h4>
                              <span className="text-sm text-gray-500">
                                기본 가격: {grade.default_price.toLocaleString()}원
                              </span>
                            </div>
                            
                            <div>
                              <label htmlFor={`price-${grade.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                                콘서트 가격 *
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  id={`price-${grade.id}`}
                                  min="0"
                                  step="100"
                                  value={currentPrice}
                                  onChange={(e) => handleSeatPriceChange(grade.id, parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">선택한 공연장에 등록된 좌석 등급이 없습니다.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 기타 정보 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">기타 정보</h3>
                <div>
                  <label htmlFor="shipping_note" className="block text-sm font-medium text-gray-700 mb-2">
                    배송/수령 안내 *
                  </label>
                  <textarea
                    id="shipping_note"
                    name="shipping_note"
                    required
                    rows={3}
                    placeholder="티켓 수령 방법에 대한 안내를 입력하세요"
                    value={formData.shipping_note}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
        )}
      </div>
    </div>
  );
} 