'use client';

import { useState, useEffect } from 'react';
import SeatSelection from '../components/SeatSelection';
import SeatGrid from '../components/SeatGrid';
import Sidebar from '../components/Sidebar';
import Payment from '../components/Payment';
import PaymentComplete from '../components/PaymentComplete';
import CaptchaModal from '../modal/CaptchaModal';
import { TicketMintResult } from '@/types/ticket';

export default function SeatPage() {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const [concertId, setConcertId] = useState<string | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [concertTitle, setConcertTitle] = useState<string | null>(null);
  const [bookingFee, setBookingFee] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(true);
  const [mintResult, setMintResult] = useState<TicketMintResult | null>(null);

  useEffect(() => {
    setConcertId(localStorage.getItem('concertId'));
    setVenueId(localStorage.getItem('venueId'));
    setSelectedDate(localStorage.getItem('selectedDate'));
    setSelectedTime(localStorage.getItem('selectedTime'));
    setConcertTitle(localStorage.getItem('concertTitle'));

    const fee = localStorage.getItem('bookingFee');
    setBookingFee(fee ? Number(fee) : 0);
  }, []);

  useEffect(() => {
    if (selectedSeatInfo) {
      localStorage.setItem('selectedSeatInfo', selectedSeatInfo);
    }
    if (sectionId) {
      localStorage.setItem('selectedZoneId', sectionId);
    }
    if (selectedRow !== null && selectedCol !== null) {
      localStorage.setItem('selectedRow', String(selectedRow));
      localStorage.setItem('selectedCol', String(selectedCol));
    }
  }, [selectedSeatInfo, sectionId, selectedRow, selectedCol]);

  const handleSectionSelect = (id: string) => {
    console.log('구역 선택됨:', id);
    setSectionId(id);
  };

  const handleSeatSelect = (
    seatInfo: string,
    sectionId: string,
    row: number,
    column: number
  ) => {
    console.log('좌석 선택됨:', seatInfo, row, column);
    setSelectedSeatInfo(seatInfo);
    setSectionId(sectionId);
    setSelectedRow(row);
    setSelectedCol(column);
  };

  return (
    <main className="relative px-6 py-4 bg-gray-50 min-h-screen overflow-x-hidden">
      {showCaptcha && !isVerified && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent pointer-events-auto" />
          <CaptchaModal
            onSuccess={() => {
              setIsVerified(true);
              setShowCaptcha(false);
            }}
            onClose={() => setShowCaptcha(false)}
          />
        </>
      )}

      {!showCaptcha && !isVerified && (
        <button
          onClick={() => setShowCaptcha(true)}
          className="absolute right-[330px] bottom-[140px] bg-white text-blue-500 border border-blue-500 shadow-lg px-4 py-2 rounded-full text-sm font-semibold z-50 cursor-pointer animate-bounce"
        >
          안심예매 인증
        </button>
      )}

      <div className="flex items-start justify-between flex-wrap gap-6 max-w-full">
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

          <div className="relative w-full min-h-[600px] overflow-visible">
            {isConfirmed ? (
              isPaid && mintResult ? (
                <PaymentComplete result={mintResult} />
              ) : (
                <Payment
                  seatInfo={selectedSeatInfo}
                  concertId={concertId}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onPaymentComplete={(result) => {
                    setMintResult(result);
                    setIsPaid(true);
                  }}
                />
              )
            ) : (
              <>
                {/* 항상 표시되는 이미지 기반 좌석 맵 */}
                <SeatSelection
                  venueId={venueId}
                  onSectionSelect={handleSectionSelect}
                />

                {/* 선택된 구역이 있을 때 좌석 상세 UI를 덮어쓰기 */}
                {sectionId && (
                  <div className="absolute top-0 left-0 w-full h-full z-10 bg-white bg-opacity-95 p-4">
                    <SeatGrid
                      concertId={concertId!}
                      sectionId={sectionId}
                      onSeatSelect={handleSeatSelect}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {!isConfirmed && (
          <div className="w-[280px] shrink-0">
            <Sidebar
              concertId={concertId ?? undefined}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedSeatInfo={selectedSeatInfo ?? undefined}
              selectedZone={sectionId ?? undefined}
              isVerified={isVerified}
              onRequireVerification={() => setShowCaptcha(true)}
              onViewAll={() => {
                console.log('전체보기 클릭됨');
                setSectionId(null);
              }}
              onSectionSelect={handleSectionSelect}
              onConfirmSeat={() => {
                setIsConfirmed(true);
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
