'use client';

import React, { FC, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';

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
  concertId: string;
  onViewAll: () => void;
  onSectionSelect: (sectionId: string) => void;
  selectedSeatInfo?: string;
  onConfirmSeat?: () => void;
  selectedZone?: string;
}

const Sidebar: FC<SidebarProps> = ({
  concertId,
  onViewAll,
  onSectionSelect,
  selectedSeatInfo,
  onConfirmSeat,
  selectedZone, 
}) => {
  const [summary, setSummary] = useState<GradeSummary[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

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

    fetchSeatSummary();
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

    fetchUser();
  }, [concertId]);

  useEffect(() => {
    console.log('Sidebar - selectedSeatInfo:', selectedSeatInfo);
  }, [selectedSeatInfo]);

  useEffect(() => {
    console.log('Sidebar - selectedZone:', selectedZone);
  }, [selectedZone]);

  const handleToggleDropdown = (grade: string) => {
    setDropdownOpen(dropdownOpen === grade ? null : grade);
  };

  const handleSectionSelect = (sectionId: string) => {
    onSectionSelect(sectionId); 
  };

  const isSelected = (zone: string) => selectedZone === zone;
  
  // 초기화 함수
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  
  // 드래그 범위 제한 함수
  const constrainOffset = (newOffset: { x: number; y: number }, currentZoom: number) => {
    const imageWidth = 260;
    const imageHeight = 150;
    const containerWidth = 288; // w-72 = 288px (실제 크기)
    const containerHeight = 180; // h-[180px] (높이 확장)
    
    // 기본 배율일 때는 드래그 비활성화
    if (currentZoom <= 1) {
      return { x: 0, y: 0 };
    }
    
    // 여백 추가 (좌석이 아슬아슬하게 짤리지 않도록)
    const margin = 15;
    
    const scaledWidth = imageWidth * currentZoom;
    const scaledHeight = imageHeight * currentZoom;
    
    // 확대된 이미지가 컨테이너보다 큰 부분 계산
    const excessWidth = Math.max(0, scaledWidth - containerWidth);
    const excessHeight = Math.max(0, scaledHeight - containerHeight);
    
    // 균형있는 드래그 범위 계산 (중심 기준)
    const halfExcessX = excessWidth / 2;
    const halfExcessY = excessHeight / 2;
    
    // 좌우 균등한 범위 
    const maxOffsetX = halfExcessX + margin;
    const minOffsetX = -(halfExcessX + margin);
    
    // 상하 균등한 범위
    const maxOffsetY = halfExcessY + margin;
    const minOffsetY = -(halfExcessY + margin);
    
    return {
      x: Math.max(minOffsetX, Math.min(maxOffsetX, newOffset.x)),
      y: Math.max(minOffsetY, Math.min(maxOffsetY, newOffset.y))
    };
  };
  
  // 확대/축소 범위 조정: 최소 1 (기본 배율), 최대 2.5 (3-4번 확대 가능)
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 2.5); // 0.5씩 증가, 최대 2.5
    setZoom(newZoom);
    // 확대 시 offset 조정
    setOffset(prev => constrainOffset(prev, newZoom));
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 1); // 0.5씩 감소, 최소 1
    setZoom(newZoom);
    // 축소 시 offset 조정
    setOffset(prev => constrainOffset(prev, newZoom));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isMouseDown.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current || !dragStart.current) return;
    
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    const dragSensitivity = 1.2;
    
    setOffset((prev) => {
      const newX = prev.x + dx * dragSensitivity;
      const newY = prev.y + dy * dragSensitivity;
      
      // 범위 제한 적용
      return constrainOffset({ x: newX, y: newY }, zoom);
    });
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isMouseDown.current = false;
    dragStart.current = null;
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      handleMouseUp();
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleConfirmSeat = async () => {
    console.log('[Sidebar] 좌석 선택 완료 버튼 클릭됨');
    console.log('selectedSeatInfo:', selectedSeatInfo);
    console.log('selectedZone:', selectedZone);
    console.log('onConfirmSeat 존재 여부:', typeof onConfirmSeat === 'function');

    if (!selectedSeatInfo || !onConfirmSeat || !selectedZone) {
      console.warn('조건이 하나 이상 충족되지 않아서 중단됨');
      return;
    }

    localStorage.setItem('selectedSeatInfo', selectedSeatInfo);

    const matchedGrade = summary.find((grade) =>
      grade.zones.some((zone) => zone.section_id === selectedZone)
    );

    if (matchedGrade) {
      localStorage.setItem('concertPrice', matchedGrade.price.toString());
      localStorage.setItem('bookingGrade', matchedGrade.grade_name);
      console.log('가격 및 등급 저장 완료:', matchedGrade.grade_name, matchedGrade.price);
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

      try {
        const res = await apiClient.post(
          `/concerts/${concertId}/seats/hold`,
          payload
        );

        if (!res.success) {
          alert('좌석을 HOLD하는 데 실패했습니다.');
          return;
        }

        console.log('좌석 HOLD 성공');
            console.log('onConfirmSeat 실행됨 → setIsConfirmed(true)');
        onConfirmSeat(); // 다음 단계로 진행
      } catch (err) {
        console.error('좌석 HOLD 오류:', err);
        alert('좌석을 HOLD하는 중 오류가 발생했습니다.');
      }
  };

  const isVIP = (name: string) =>
    name.replace(/\s+/g, '').toLowerCase().includes('vip');

  return (
    <div className="w-72 h-[calc(100vh-48px)] bg-white border border-gray-300 p-4 shadow-md flex flex-col justify-between">
      <div>
        <div className="mb-4 flex justify-center">
          <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} />
        </div>

        <div className="relative mb-4">
          <div
            ref={containerRef}
            className="overflow-hidden flex justify-start items-start h-[180px] border rounded bg-gray-100"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'grab' }}
          >
            <div
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isMouseDown.current ? 'none' : 'transform 0.1s ease-out',
                willChange: 'transform',
              }}
            >
              <Image
                src="/images/콘서트-좌석-이미지(KSPO-DOME).jpg"
                alt="좌석도 전체보기"
                width={260}
                height={150}
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </div>

          <div className="absolute top-2 right-2 flex flex-row gap-1 bg-white bg-opacity-90 rounded shadow p-1">
            <button 
              className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              title="확대"
            >
              +
            </button>
            <button 
              className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              title="축소"
            >
              −
            </button>
            <button 
              className="text-sm px-2 py-1 bg-blue-200 rounded hover:bg-blue-300 transition-colors" 
              onClick={handleReset}
              title="초기화"
            >
              ↺
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4 mb-4">
          <button className="text-sm text-gray-700 underline hover:text-blue-600" onClick={onViewAll}>
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
                  <span className={`w-3 h-3 rounded-sm border ${
                    isVIP(grade_name) ? 'bg-fuchsia-200 border-fuchsia-300' : 'bg-blue-100 border-blue-200'
                  }`} />
                  <span>{grade_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">{price.toLocaleString()}원</span>
                  <span className={`text-lg transition-transform duration-300 ${dropdownOpen === grade_name ? 'rotate-180 text-gray-500' : 'text-gray-400'}`}>
                    ⌄
                  </span>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out rounded-md ${
                  dropdownOpen === grade_name ? 'max-h-60 mt-2' : 'max-h-0'
                } bg-gray-50`}
              >
                <ul className={`px-8 py-1 ${grade_name === '일반석' ? 'overflow-y-auto max-h-60' : ''}`}>
                  {zones
                    .sort((a, b) =>
                      grade_name === 'VIP' ? a.code.localeCompare(b.code) : Number(a.code) - Number(b.code)
                    )
                    .map(({ code, available, section_id }) => (
                      <li
                        key={code}
                        className={`cursor-pointer text-sm mb-1 flex justify-between ${
                          isSelected(section_id) ? 'text-black font-bold' : 'text-gray-600'
                        } ${available === 0 ? 'line-through text-gray-400 cursor-not-allowed' : ''}`}
                        onClick={() => available > 0 && handleSectionSelect(section_id)}
                      >
                        <span>{grade_name === 'VIP' ? `FLOOR ${code}` : `${code} 구역`}</span>
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
