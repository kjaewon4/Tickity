'use client';

import { useState, useEffect } from 'react';
import SeatSelection from '../components/SeatSelection';
import SeatGrid from '../components/SeatGrid';
import Sidebar from '../components/Sidebar';
import Payment from '../components/Payment';

export default function SeatPage() {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

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

  const handleSectionSelect = (id: string) => {
    setSectionId(id);
  };

  return (
    <main className="px-6 py-4 bg-gray-50 min-h-screen overflow-x-hidden">
      <div className="flex items-start justify-between flex-wrap gap-6 max-w-full">
        {/* 좌측: 본문 */}
        <div className="flex-1 min-w-0">
          {!isConfirmed && (
            <div className="flex items-center justify-between mb-4 flex-wrap">
              <h1 className="text-xl font-bold whitespace-nowrap">
                좌석 선택 {concertTitle}
              </h1>
              <select className="border rounded px-3 py-1 text-sm mt-2 md:mt-0">
                <option>{selectedDate} {selectedTime}</option>
              </select>
            </div>
          )}

          <div className="w-full overflow-hidden">
            {isConfirmed ? (
              <Payment
                seatInfo={selectedSeatInfo}
                concertId={concertId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
              />
            ) : sectionId ? (
              <SeatGrid
                concertId={concertId}
                sectionId={sectionId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSeatSelect={setSelectedSeatInfo}
              />
            ) : (
              <SeatSelection
                venueId={venueId}
                onSectionSelect={handleSectionSelect}
              />
            )}
          </div>
        </div>

        {/* 우측: 사이드바 */}
        {!isConfirmed && (
          <div className="w-[280px] shrink-0">
            <Sidebar
              concertId={concertId}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedSeatInfo={selectedSeatInfo ?? undefined}
              onViewAll={() => setSectionId(null)}
              onSectionSelect={handleSectionSelect}
              onConfirmSeat={() => setIsConfirmed(true)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
