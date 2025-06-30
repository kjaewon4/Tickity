'use client';

import { useState, useEffect } from 'react';
import SeatSelection from '../components/SeatSelection';
import SeatGrid from '../components/SeatGrid';
import Sidebar from '../components/Sidebar';

export default function SeatPage() {
  // 🔹 구역 선택 시 넘어오는 섹션 ID (section_id)
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null); 

  // 🔹 콘서트 관련 정보 (localStorage에서 로드)
  const [concertId, setConcertId] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [concertTitle, setConcertTitle] = useState<string | null>(null);

  useEffect(() => {
    setConcertId(localStorage.getItem('concertId'));
    setVenueId(localStorage.getItem('venueId'));
    setSelectedDate(localStorage.getItem('selectedDate'));
    setSelectedTime(localStorage.getItem('selectedTime'));
    setConcertTitle(localStorage.getItem('concertTitle'));
  }, []);

  // 🔹 Sidebar, SeatSelection에서 선택된 섹션 ID 처리
  const handleSectionSelect = (id: string) => {
     console.log('[DEBUG] 선택된 섹션:', id); 
    setSectionId(id);
  };

  return (
    <main className="px-6 py-4 bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="flex items-start justify-between flex-wrap gap-6 max-w-full">
        {/* 좌측: 제목 + 날짜 + 좌석 선택 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap">
            <h1 className="text-xl font-bold whitespace-nowrap">
              좌석 선택 {concertTitle}
            </h1>
            <select className="border rounded px-3 py-1 text-sm mt-2 md:mt-0">
              <option>{selectedDate} {selectedTime}</option>
            </select>
          </div>

          {/* 좌석 영역 */}
          <div className="w-full overflow-hidden">
            {sectionId ? (
              <SeatGrid
                concertId={concertId}
                sectionId={sectionId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSeatSelect={setSelectedSeatInfo} // 포도알 선택 시 정보 전달
              />
            ) : (
              <SeatSelection
                venueId={venueId}
                onSectionSelect={handleSectionSelect} // 좌석도 전체 보기 클릭 시
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[280px] shrink-0">
          <Sidebar
            concertId={concertId}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedSeatInfo={selectedSeatInfo ?? undefined}
            onViewAll={() => setSectionId(null)}
            onSectionSelect={(sectionId) => setSectionId(sectionId)} // 섹션 선택 시
          />
        </div>
      </div>
    </main>
  );
}
