'use client';

import { useState, useEffect } from 'react';
import SeatSelection from '../components/SeatSelection';
import SeatGrid from '../components/SeatGrid';
import Sidebar from '../components/Sidebar';

export default function SeatPage() {
  const [zoneNumber, setZoneNumber] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null); 

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
  const handleZoneSelect = (id: string) => {
    setZoneNumber(id);
  };

  return (
    <main className="px-6 py-4 bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="flex items-start justify-between flex-wrap gap-6 max-w-full">
        {/* 좌측: 제목 + 날짜 + 좌석 선택 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap">
            <h1 className="text-xl font-bold whitespace-nowrap">좌석 선택 {concertTitle}</h1>
            <select className="border rounded px-3 py-1 text-sm mt-2 md:mt-0">
              <option>{selectedDate} {selectedTime}</option>
            </select>
          </div>

          {/* 좌석 영역 */}
          <div className="w-full overflow-hidden">
            {zoneNumber ? (
              <SeatGrid
                concertId={concertId}
                zoneNumber={zoneNumber}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSeatSelect={(info) => setSelectedSeatInfo(info)} // ✅ SeatGrid에서 선택된 좌석 정보 전달 받음
              />
            ) : (
              <SeatSelection venueId={venueId} onZoneSelect={handleZoneSelect} />
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
            onViewAll={() => setZoneNumber(null)}
            onZoneSelect={(zoneId) => setZoneNumber(zoneId)}
          />
        </div>
      </div>
    </main>
  );
}
