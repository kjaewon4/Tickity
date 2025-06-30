'use client';

import React, { FC, useState, useRef, useEffect } from 'react';
import Image from 'next/image';

/* ───────── 타입 ───────── */
interface ZoneInfo {
  code: string;
  available: number;
}
interface GradeSummary {
  grade_name: string;      // 'VIP' | '일반석'
  price: number;
  zones: ZoneInfo[];
}

interface SidebarProps {
  concertId: string;                 
  onViewAll: () => void;
  onZoneSelect: (zoneId: string) => void;
  selectedSeatInfo?: string;
}

const seatGrades = {
  VIP: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'],
  일반석: Array.from({ length: 43 }, (_, i) => (i + 1).toString()),
};

const Sidebar: FC<SidebarProps> = ({ concertId, onViewAll, onZoneSelect, selectedSeatInfo }) => {
  /* ▣ API 로드 결과 */
  const [summary, setSummary] = useState<GradeSummary[]>([]);
  /* ▣ 선택 상태 */
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  /* ▣ 확대·드래그 상태 (기존 코드 그대로) */
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);

  /* ───── 1. API 호출 ───── */
  useEffect(() => {
    if (!concertId) return;

    const fetchSeatSummary = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/seat-summary?withTotal=false`
        );
        const result = await res.json();
        
        if (result.success && Array.isArray(result.data)) {
          setSummary(result.data); // ✅ 핵심: result.data만 set
        } else {
          console.error('Invalid summary format:', result);
          setSummary([]); // fallback
        }
      } catch (err) {
        console.error('좌석 요약 정보 조회 실패:', err);
      }
    };

    fetchSeatSummary();
  }, [concertId]);

  const handleToggleDropdown = (grade: string) => {
    setDropdownOpen(dropdownOpen === grade ? null : grade);
  };

  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone);
    onZoneSelect(zone);
  };

  const isSelected = (zone: string) => selectedZone === zone;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDown.current = true; // ✅ 마우스 누름 시작
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current || !dragStart.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isMouseDown.current = false; // ✅ 마우스 놓으면 종료
    dragStart.current = null;
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-72 h-[calc(100vh-48px)] bg-white border border-gray-300 p-4 shadow-md flex flex-col justify-between">
      <div>
        {/* 로고 */}
        <div className="mb-4 flex justify-center">
          <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} />
        </div>

        {/* 전체 좌석 이미지 + 확대/축소 */}
        <div className="relative mb-4">
          <div
            className="overflow-hidden flex justify-start items-start h-[160px] border rounded bg-gray-100"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            style={{ cursor: isMouseDown.current ? 'grabbing' : 'grab' }}
          >
            <div
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
                transition: isMouseDown.current ? 'none' : 'transform 0.2s ease',
              }}
            >
              <Image
                src="/images/콘서트-좌석-이미지(KSPO-DOME).jpg"
                alt="좌석도 전체보기"
                width={260}
                height={150}
              />
            </div>
          </div>

          {/* 확대/축소 버튼 */}
          <div className="absolute top-2 right-2 flex flex-row gap-1 bg-white bg-opacity-80 rounded shadow p-1">
            <button
              className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={handleZoomIn}
            >
              +
            </button>
            <button
              className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={handleZoomOut}
            >
              −
            </button>
          </div>
        </div>

        {/* 좌석도 전체보기 버튼 */}
        <div className="flex justify-end mt-4 mb-4">
          <button
            className="text-sm text-gray-700 underline hover:text-blue-600"
            onClick={onViewAll}
          >
            좌석도 전체보기 &gt;
          </button>
        </div>

        {/* 좌석 등급/잔여석 ───────────────────────────── */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2">좌석등급/잔여석</h2>

          {summary.map(({ grade_name, price, zones }) => (
            <div className="mb-2" key={grade_name}>
              {/* 드롭다운 헤더 */}
              <div
                className={`flex justify-between items-center cursor-pointer px-2 py-1 rounded transition-colors ${
                  dropdownOpen === grade_name ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleToggleDropdown(grade_name)}
              >
                <div className="flex gap-2 items-center">
                  <span
                    className={`w-3 h-3 rounded-sm ${
                      grade_name === 'VIP' ? 'bg-[#a18869]' : 'bg-[#b49cfd]'
                    }`}
                  />
                  <span>{grade_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">
                    {price.toLocaleString()}원
                  </span>
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

              {/* 드롭다운 내부 */}
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
                        : Number(a.code) - Number(b.code),
                    )
                    .map(({ code, available }) => (
                      <li
                        key={code}
                        className={`cursor-pointer text-sm mb-1 flex justify-between ${
                          isSelected(code)
                            ? 'text-black font-bold'
                            : 'text-gray-600'
                        } ${
                          available === 0
                            ? 'line-through text-gray-400 cursor-not-allowed'
                            : ''
                        }`}
                        onClick={() => available > 0 && handleZoneSelect(code)}
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

      {/* ───── 하단 버튼 ───── */}
      <div>
        {selectedSeatInfo && (
          <div className="text-blue-600 text-sm text-center mb-2 border border-blue-200 bg-blue-50 rounded px-2 py-1">
            {selectedSeatInfo}
          </div>
        )}
        <button
          className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-800 disabled:bg-gray-300 transition"
          disabled={!selectedZone}
        >
          좌석 선택 완료
        </button>
      </div>
    </div>
  );
};

export default Sidebar;