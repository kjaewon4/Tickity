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
    ticket_open_at: ''
  });

  // 공연장 목록 로드
  useEffect(() => {
    const loadVenues = async () => {
      try {
        setVenuesLoading(true);
        const response = await apiClient.get('/venues');
        
        if (response && response.success) {
          setVenues(response.data || []);
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

    loadVenues();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 실제 데이터베이스 스키마에 맞춘 데이터 구성
      const processedData = {
        // 기본 필수 필드들
        title: formData.title,
        date: new Date(formData.date).toISOString(),
        main_performer: formData.main_performer,
        organizer: formData.organizer,
        promoter: formData.promoter,
        customer_service: formData.customer_service,
        running_time: formData.running_time,
        age_rating: formData.age_rating,
        booking_fee: formData.booking_fee,
        shipping_note: formData.shipping_note,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
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
        poster_url: formData.poster_url || null,
        venue_id: formData.venue_id || null,
        start_date: formData.start_date || null,
        start_time: formData.start_time || null,
        ticket_open_at: formData.ticket_open_at ? new Date(formData.ticket_open_at).toISOString() : null,
        android_min_version: "7.0",
        ios_min_version: "12.0",
      };

      const response = await apiClient.post('/concerts', processedData);

      if (response.success) {
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
                  공연장 {venuesLoading && <span className="text-sm text-gray-500">(로딩 중...)</span>}
                </label>
                <select
                  id="venue_id"
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleInputChange}
                  disabled={venuesLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">공연장 선택</option>
                  {venuesLoading ? (
                    <option value="" disabled>공연장 정보를 불러오는 중...</option>
                  ) : venues.length === 0 ? (
                    <option value="" disabled>등록된 공연장이 없습니다</option>
                  ) : (
                    venues.map(venue => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.address}
                      </option>
                    ))
                  )}
                  <option value="기타">기타 (장소 미정)</option>
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
                  <option value="">카테고리 선택</option>
                  <option value="여자아이돌">여자아이돌</option>
                  <option value="남자아이돌">남자아이돌</option>
                  <option value="솔로 가수">솔로 가수</option>
                  <option value="내한공연">내한공연</option>
                  <option value="랩/힙합">랩/힙합</option>
                </select>
              </div>

              <div>
                <label htmlFor="age_rating" className="block text-sm font-medium text-gray-700 mb-2">
                  관람등급
                </label>
                <input
                  type="text"
                  id="age_rating"
                  name="age_rating"
                  value="만 14세 이상"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="running_time" className="block text-sm font-medium text-gray-700 mb-2">
                  공연시간 *
                </label>
                <input
                  type="text"
                  id="running_time"
                  name="running_time"
                  required
                  placeholder="예: 120분 (인터미션 15분 포함)"
                  value={formData.running_time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="booking_fee" className="block text-sm font-medium text-gray-700 mb-2">
                  예매 수수료 (원) *
                </label>
                <input
                  type="number"
                  id="booking_fee"
                  name="booking_fee"
                  required
                  min="0"
                  value={formData.booking_fee === 0 ? '' : formData.booking_fee}
                  onChange={handleInputChange}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = '';
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setFormData(prev => ({ ...prev, booking_fee: 0 }));
                    }
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 예매 기간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-2">
                  예매 시작일 *
                </label>
                <input
                  type="date"
                  id="valid_from"
                  name="valid_from"
                  required
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
                  value={formData.valid_to}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ticket_open_date" className="block text-sm font-medium text-gray-700 mb-2">
                  티켓 오픈 날짜
                </label>
                <input
                  type="date"
                  id="ticket_open_date"
                  name="ticket_open_date"
                  value={formData.ticket_open_at ? formData.ticket_open_at.split('T')[0] : ''} // 날짜 부분만 표시
                  onChange={(e) => {
                    // 날짜가 변경되면 시간은 09:00으로 기본 설정
                    const newDateTime = e.target.value ? `${e.target.value}T09:00` : '';
                    setFormData(prev => ({ ...prev, ticket_open_at: newDateTime }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ticket_open_time" className="block text-sm font-medium text-gray-700 mb-2">
                  티켓 오픈 시간
                </label>
                <input
                  type="time"
                  id="ticket_open_time"
                  name="ticket_open_time"
                  value={formData.ticket_open_at ? (formData.ticket_open_at.split('T')[1] || '09:00') : '09:00'} // 시간 부분만 표시
                  onChange={(e) => {
                    // 시간이 변경되면 날짜와 결합
                    const dateOnly = formData.ticket_open_at ? formData.ticket_open_at.split('T')[0] : new Date().toISOString().split('T')[0];
                    const newDateTime = `${dateOnly}T${e.target.value}`;
                    setFormData(prev => ({ ...prev, ticket_open_at: newDateTime }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-2">
                  회차 수 *
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
            </div>

            {/* 주최/주관 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  주관/기획 *
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
                <label htmlFor="customer_service" className="block text-sm font-medium text-gray-700 mb-2">
                  고객센터 *
                </label>
                <input
                  type="text"
                  id="customer_service"
                  name="customer_service"
                  required
                  placeholder="예: 1588-1234"
                  value={formData.customer_service}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="poster_url" className="block text-sm font-medium text-gray-700 mb-2">
                  포스터 URL
                </label>
                <input
                  type="url"
                  id="poster_url"
                  name="poster_url"
                  value={formData.poster_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
      </div>
    </div>
  );
} 