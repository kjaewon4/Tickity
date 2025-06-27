'use client';

import React, { FC, useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface SidebarProps {
  onViewAll: () => void;
  onZoneSelect: (zoneId: string) => void;
  selectedSeatInfo?: string;
}

const seatGrades = {
  VIP: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'],
  일반석: Array.from({ length: 43 }, (_, i) => (i + 1).toString()),
};

const Sidebar: FC<SidebarProps> = ({ onViewAll, onZoneSelect, selectedSeatInfo }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false); // ✅ 마우스를 누르고 있는 상태를 추적

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

        {/* 좌석 등급/잔여석 */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2">좌석등급/잔여석</h2>
          {(['VIP', '일반석'] as const).map((grade) => (
            <div className="mb-2" key={grade}>
              <div
                className={`flex justify-between items-center cursor-pointer px-2 py-1 rounded transition-colors ${
                  dropdownOpen === grade ? 'bg-gray-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleToggleDropdown(grade)}
              >
                <div className="flex gap-2 items-center">
                  <span
                    className={`w-3 h-3 rounded-sm ${
                      grade === 'VIP' ? 'bg-[#a18869]' : 'bg-[#b49cfd]'
                    }`}
                  ></span>
                  <span>{grade}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">
                    {grade === 'VIP' ? '165,000원' : '132,000원'}
                  </span>
                  <span
                    className={`text-lg transition-transform duration-300 ${
                      dropdownOpen === grade
                        ? 'rotate-180 text-gray-500'
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    ⌄
                  </span>
                </div>
              </div>

              {/* 드롭다운 내용 */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out rounded-md ${
                  dropdownOpen === grade ? 'max-h-60 mt-2' : 'max-h-0'
                } bg-gray-50`}
              >
                <ul
                  className={`px-8 py-1 ${
                    grade === '일반석' ? 'overflow-y-auto max-h-60' : ''
                  }`}
                >
                  {seatGrades[grade].map((zone) => (
                    <li
                      key={zone}
                      className={`cursor-pointer text-sm mb-1 ${
                        isSelected(zone) ? 'text-black font-bold' : 'text-gray-600'
                      }`}
                      onClick={() => handleZoneSelect(zone)}
                    >
                      {grade === 'VIP' ? `FLOOR 층 ${zone} 구역` : `${zone} 구역`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 선택 좌석 정보 + 버튼 */}
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
