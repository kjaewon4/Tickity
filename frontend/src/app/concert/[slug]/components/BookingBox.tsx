import React from 'react';
import { Concert } from '../types';

interface BookingBoxProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onReservation: () => void;
  concert: Pick<Concert, 'start_date' | 'start_time' | 'ticket_open_at'>;
  price: string;
  calendarDays: Array<number | null>;
}

const BookingBox: React.FC<BookingBoxProps> = ({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onReservation,
  concert,
  price,
  calendarDays
}) => {
  const now = new Date();
  const ticketOpenAt = concert.ticket_open_at ? new Date(concert.ticket_open_at) : null;
  const isBeforeOpen = ticketOpenAt ? now < ticketOpenAt : false;

  // 예매일 텍스트: 무조건 YYYY년 M월 D일 HH:mm 형식
  const renderOpenDate = () => {
    if (!ticketOpenAt) return null;

    const year = ticketOpenAt.getFullYear();
    const month = ticketOpenAt.getMonth() + 1;
    const date = ticketOpenAt.getDate();
    const hours = String(ticketOpenAt.getHours()).padStart(2, '0');
    const minutes = String(ticketOpenAt.getMinutes()).padStart(2, '0');

    return `${year}년 ${month}월 ${date}일 ${hours}:${minutes} | 예정`;
  };

  return (
<div className="w-full max-w-[460px] rounded-2xl p-8 shadow-md">
  <h3 className="text-lg font-semibold mb-5">관람일 선택</h3>
  <div className="flex justify-between items-center mb-4 text-base">
    <button className="text-gray-400" disabled>&lt;</button>
    <span className="font-semibold text-gray-800">{selectedDate.slice(0, 7).replace('-', '년 ') + '월'}</span>
    <button className="text-gray-400" disabled>&gt;</button>
  </div>

  <div className="grid grid-cols-7 gap-2 text-base mb-6 place-items-center font-semibold">
    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
      <div key={d} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-800'}>
        {d}
      </div>
    ))}
    {calendarDays.map((day, idx) => {
      if (!day) return <div key={`empty-${idx}`} className="w-10 h-10" />;
      
      const baseDate = new Date(concert.start_date);
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth() + 1;
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const isAvailable = date === concert.start_date;
      const isSelected = selectedDate === date;

      const baseStyle = "w-10 h-10 flex items-center justify-center rounded-full text-base leading-none";

      return (
        <button
          key={day}
          className={`${baseStyle} ${isSelected ? 'bg-blue-500 text-white' : isAvailable ? 'hover:bg-gray-200 text-black' : 'text-gray-300 cursor-not-allowed'}`}
          onClick={() => isAvailable && onDateChange(date)}
          disabled={!isAvailable}
        >
          {day}
        </button>
      );
    })}
  </div>

  <h3 className="text-lg font-semibold mb-4">회차 선택</h3>
  <div className="space-y-3 mb-6">
    {concert.start_time && (() => {
      const label = `${concert.start_time.slice(0, 5)}`;
      const isSelected = selectedTime === label;
      return (
        <button
          className={`w-full rounded-md px-5 py-3 flex justify-between items-center text-base ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-blue-100'}`}
          onClick={() => onTimeChange(label)}
        >
          <span>{label}</span>
          <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-500'}`}>
            {isSelected ? '선택됨' : '예매 가능'}
          </span>
        </button>
      );
    })()}
  </div>

  <div className="text-base text-gray-600 mb-2">선택 정보</div>
  <div className="text-base font-medium mb-4">{selectedDate} {selectedTime}</div>
  <div className="text-lg font-bold text-blue-600 mb-6">{price}</div>
  
  {/* 예매 버튼 또는 예정 안내 */}
  {isBeforeOpen ? (
    <div className="w-full text-center text-base text-gray-500 py-4 bg-gray-100 rounded-md">
      {renderOpenDate()}
    </div>
  ) : (
    <button
      className="w-full bg-blue-600 text-white rounded-md py-4 font-semibold text-base hover:bg-blue-700 disabled:bg-gray-300"
      onClick={onReservation}
      disabled={!selectedTime}
    >
      예약하기
    </button>
  )}
</div>

  );
};

export default BookingBox;
