'use client';

import { useState } from 'react';
import SeatSelection from '../components/SeatSelection';
import SeatGrid from '../components/SeatGrid';
import Sidebar from '../components/Sidebar';

export default function SeatPage() {
  const [zoneNumber, setZoneNumber] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null); 

  const handleZoneSelect = (id: string) => {
    setZoneNumber(id);
  };

  return (
    <main className="px-6 py-4 bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="flex items-start justify-between flex-wrap gap-6 max-w-full">
        {/* 좌측: 제목 + 날짜 + 좌석 선택 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap">
            <h1 className="text-xl font-bold whitespace-nowrap">좌석 선택 2025 MONSTA X CONNECT X</h1>
            <select className="border rounded px-3 py-1 text-sm mt-2 md:mt-0">
              <option>2025.07.19 (토) 18:00</option>
            </select>
          </div>

          {/* 좌석 영역 */}
          <div className="w-full overflow-hidden">
            {zoneNumber ? (
              <SeatGrid
                zoneNumber={zoneNumber}
                onSeatSelect={(info) => setSelectedSeatInfo(info)} // ✅ SeatGrid에서 선택된 좌석 정보 전달 받음
              />
            ) : (
              <SeatSelection onZoneSelect={handleZoneSelect} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0">
          <Sidebar
            onViewAll={() => setZoneNumber(null)}
            onZoneSelect={(zoneId) => setZoneNumber(zoneId)}
            selectedSeatInfo={selectedSeatInfo ?? undefined}
          />
        </div>
      </div>
    </main>
  );
}
