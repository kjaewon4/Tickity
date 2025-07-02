'use client';

import { useState, useEffect } from 'react';

interface Venue {
  id: string;
  name: string;
  address: string;
  capacity?: number;
}

interface ConcertBasicSectionProps {
  formData: {
    title: string;
    main_performer: string;
    start_date: string;
    start_time: string;
    venue_id?: string;
    category: string;
    organizer: string;
    promoter: string;
    customer_service: string;
    running_time: string;
    round: number;
    poster_url?: string;
  };
  venues: Venue[];
  venuesLoading: boolean;
  selectedFile: File | null;
  previewUrl: string;
  uploadLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVenueChange: (venueId: string) => void;
}

export default function ConcertBasicSection({
  formData,
  venues,
  venuesLoading,
  selectedFile,
  previewUrl,
  uploadLoading,
  onInputChange,
  onFileSelect,
  onVenueChange
}: ConcertBasicSectionProps) {
  const today = new Date().toISOString().split('T')[0];

  const handleVenueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onInputChange(e);
    if (e.target.value) {
      onVenueChange(e.target.value);
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
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
              onChange={onInputChange}
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
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              공연 날짜 *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              required
              min={today}
              value={formData.start_date}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
              공연 시간 *
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              required
              value={formData.start_time}
              onChange={onInputChange}
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
              onChange={handleVenueChange}
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
              onChange={onInputChange}
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
              주최자 *
            </label>
            <input
              type="text"
              id="organizer"
              name="organizer"
              required
              value={formData.organizer}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="promoter" className="block text-sm font-medium text-gray-700 mb-2">
              기획사 *
            </label>
            <input
              type="text"
              id="promoter"
              name="promoter"
              required
              value={formData.promoter}
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              placeholder="예: 90분"
              value={formData.running_time}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 포스터 업로드 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">포스터 이미지</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="poster" className="block text-sm font-medium text-gray-700 mb-2">
              포스터 업로드
            </label>
            <input
              type="file"
              id="poster"
              accept="image/*"
              onChange={onFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG, GIF 파일을 업로드하세요 (최대 5MB)
            </p>
          </div>

          {/* 미리보기 */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미리보기
              </label>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="포스터 미리보기"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            </div>
          )}
        </div>

        {uploadLoading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">포스터를 업로드하는 중...</p>
          </div>
        )}
      </div>
    </div>
  );
} 