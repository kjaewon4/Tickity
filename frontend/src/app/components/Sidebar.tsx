'use client';

import React, { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import MiniSeatMap from './MiniSeatMap';

interface ZoneInfo {
  code: string;
  available: number;
  section_id: string;
}

interface GradeSummary {
  grade_name: string;
  price: number;
  zones: ZoneInfo[];
}

interface SidebarProps {
  concertId?: string;
  onViewAll: () => void;
  selectedDate?: string | null;
  selectedTime?: string | null;
  onSectionSelect: (sectionId: string) => void;
  selectedSeatInfo?: string;
  onConfirmSeat?: () => void;
  selectedZone?: string;
  isVerified: boolean;
  onRequireVerification?: () => void;
}

const Sidebar: FC<SidebarProps> = ({
  concertId,
  onViewAll,
  onSectionSelect,
  selectedSeatInfo,
  onConfirmSeat,
  selectedZone,
  isVerified,
  onRequireVerification,
}) => {
  const [summary, setSummary] = useState<GradeSummary[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [venueId, setVenueId] = useState('');

  useEffect(() => {
    if (!concertId) return;

    const fetchSeatSummary = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/seat-summary?withTotal=false`
        );
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setSummary(result.data);
        } else {
          console.error('Invalid summary format:', result);
          setSummary([]);
        }
      } catch (err) {
        console.error('좌석 요약 정보 조회 실패:', err);
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await apiClient.getUserWithToken(token);
          if (res.success && res.data?.user) setUser(res.data.user);
          else localStorage.removeItem('accessToken');
        } catch {
          localStorage.removeItem('accessToken');
        }
      }
    };

    const storedVenueId = localStorage.getItem('venueId');
    if (storedVenueId) setVenueId(storedVenueId);

    fetchSeatSummary();
    fetchUser();
  }, [concertId]);

  const handleToggleDropdown = (grade: string) => {
    setDropdownOpen(dropdownOpen === grade ? null : grade);
  };

  const handleSectionSelect = (sectionId: string) => {
    onSectionSelect(sectionId);
  };

  const isSelected = (zone: string) => selectedZone === zone;

  const handleConfirmSeat = async () => {
    if (!selectedSeatInfo || !onConfirmSeat || !selectedZone) return;

    if (!isVerified) {
      if (onRequireVerification) onRequireVerification();
      return;
    }

    localStorage.setItem('selectedSeatInfo', selectedSeatInfo);

    const matchedGrade = summary.find((grade) =>
      grade.zones.some((zone) => zone.section_id === selectedZone)
    );

    if (matchedGrade) {
      localStorage.setItem('concertPrice', matchedGrade.price.toString());
      localStorage.setItem('bookingGrade', matchedGrade.grade_name);
    }

    const concertId = localStorage.getItem('concertId');
    const row = Number(localStorage.getItem('selectedRow'));
    const col = Number(localStorage.getItem('selectedCol'));
    const sectionId = localStorage.getItem('selectedZoneId');
    const userId = user?.id;

    if (!concertId || row === undefined || col === undefined || !userId) {
      alert('결제 정보가 부족합니다.');
      return;
    }

    const payload = {
      sectionId,
      row,
      col,
      userId,
    };

    interface HoldSeatResponse {
      hold_expires_at: string;
    }

    try {
      const res = await apiClient.post<HoldSeatResponse>(
        `/concerts/${concertId}/seats/hold`,
        payload
      );

      if (!res.success || !res.data?.hold_expires_at) {
        alert('좌석을 HOLD하는 데 실패했습니다.');
        return;
      }

    localStorage.setItem('holdExpiresAt', res.data.hold_expires_at);
    onConfirmSeat();
  } catch (err) {
    console.error('좌석 HOLD 오류:', err);
    alert('좌석을 HOLD하는 중 오류가 발생했습니다.');
  }
}

  const isVIP = (name: string) =>
    name.replace(/\s+/g, '').toLowerCase().includes('vip');

  return (
    <div className="w-72 h-[calc(100vh-48px)] bg-white border border-gray-300 p-4 shadow-md flex flex-col justify-between">
      <div>
        <div className="mb-4 flex justify-center">
          <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} />
        </div>

        <div className="mb-4">
          {venueId && (
            <MiniSeatMap
              venueId={venueId}
              onSectionSelect={onSectionSelect}
            />
          )}
        </div>

        <div className="flex justify-end mt-4 mb-4">
          <button
            className="text-sm text-gray-700 underline hover:text-blue-600"
            onClick={onViewAll}
          >
            좌석도 전체보기 &gt;
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2">좌석등급/잔여석</h2>
          {summary.map(({ grade_name, price, zones }) => (
            <div className="mb-2" key={grade_name}>
              <div
                className={`flex justify-between items-center cursor-pointer px-2 py-1 rounded transition-colors ${
                  dropdownOpen === grade_name ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleToggleDropdown(grade_name)}
              >
                <div className="flex gap-2 items-center">
                  <span
                    className={`w-3 h-3 rounded-sm border ${
                      isVIP(grade_name)
                        ? 'bg-fuchsia-200 border-fuchsia-300'
                        : 'bg-blue-100 border-blue-200'
                    }`}
                  />
                  <span>{grade_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">{price.toLocaleString()}원</span>
                  <span
                    className={`text-lg transition-transform duration-300 ${
                      dropdownOpen === grade_name
                        ? 'rotate-180 text-gray-500'
                        : 'text-gray-400'
                    }`}
                  >
                    ⌄
                  </span>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out rounded-md ${
                  dropdownOpen === grade_name ? 'max-h-60 mt-2' : 'max-h-0'
                } bg-gray-50`}
              >
                <ul
                  className={`px-8 py-1 ${
                    grade_name === '일반석' ? 'overflow-y-auto max-h-60' : ''
                  }`}
                >
                  {zones
                    .sort((a, b) =>
                      grade_name === 'VIP'
                        ? a.code.localeCompare(b.code)
                        : Number(a.code) - Number(b.code)
                    )
                    .map(({ code, available, section_id }) => (
                      <li
                        key={code}
                        className={`cursor-pointer text-sm mb-1 flex justify-between ${
                          isSelected(section_id)
                            ? 'text-black font-bold'
                            : 'text-gray-600'
                        } ${
                          available === 0
                            ? 'line-through text-gray-400 cursor-not-allowed'
                            : ''
                        }`}
                        onClick={() => available > 0 && handleSectionSelect(section_id)}
                      >
                        <span>
                          {grade_name === 'VIP' ? `FLOOR ${code}` : `${code} 구역`}
                        </span>
                        <span>{available}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedSeatInfo && (
          <div className="text-blue-600 text-sm text-center mb-2 border border-blue-200 bg-blue-50 rounded px-2 py-1">
            {selectedSeatInfo}
          </div>
        )}
        <button
          onClick={handleConfirmSeat}
          disabled={!selectedSeatInfo}
          className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          좌석 선택 완료
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
