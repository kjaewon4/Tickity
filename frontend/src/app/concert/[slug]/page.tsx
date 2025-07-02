"use client";

import React, { useState, useEffect, useMemo } from 'react';
import '../../globals.css';
import { useParams } from 'next/navigation';
import { useConcertData, useAuth, useFavorite } from './hooks';
import { ConcertHeader, ConcertInfoTabs, BookingBox } from './components';

const ConcertDetail = () => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState('공연정보');

  // 커스텀 훅들 사용
  const { concert, policies, ticketInfo, loading, error } = useConcertData();
  const { userId } = useAuth();
  const { liked, favoriteLoading, handleFavoriteToggle } = useFavorite(concert, userId);

  const calendarDays = useMemo(() => {
    if (!concert?.start_date) return [];
    const start = new Date(concert?.start_date);
    const year = start.getFullYear();
    const month = start.getMonth(); // 0-based
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: Array<number | null> = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [concert?.start_date]);

  useEffect(() => {
    if (concert?.start_date) {
      setSelectedDate(concert.start_date);
    }
  }, [concert]);

  const handleReservation = () => {
    if (!concert) return;
    localStorage.setItem('concertId', concert.id);
    localStorage.setItem('concertTitle', concert.title);
    localStorage.setItem('venueId', concert.venue_id);
    localStorage.setItem('selectedDate', selectedDate);
    localStorage.setItem('selectedTime', selectedTime);

    const width = 1172, height = 812;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/seat',
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=no`
    );
    if (popup) popup.focus();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!concert || !ticketInfo) return <div className="p-6">콘서트 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col lg:flex-row justify-center gap-6 p-6 bg-white text-[#222]">
      <div className="flex flex-col gap-4 w-full lg:w-[600px]">
        {/* 콘서트 헤더 */}
        <ConcertHeader
          ticketInfo={ticketInfo}
          liked={liked}
          favoriteLoading={favoriteLoading}
          onFavoriteToggle={handleFavoriteToggle}
        />

        {/* 콘서트 정보 탭 */}
        <ConcertInfoTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ticketInfo={ticketInfo}
          concert={concert}
          policies={policies}
        />
      </div>

      {/* 예약 박스 */}
      <BookingBox
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateChange={setSelectedDate}
        onTimeChange={setSelectedTime}
        onReservation={handleReservation}
        concert={concert}
        price={ticketInfo.price}
        calendarDays={calendarDays}
      />
    </div>
  );
};

export default ConcertDetail; 