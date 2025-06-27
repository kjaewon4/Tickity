"use client";

import React, { useState, useMemo } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import '../globals.css';

const tabs = ['공연정보', '판매정보'];

const ReservationDetail = () => {
  const [selectedDate, setSelectedDate] = useState('2025-08-01');
  const [selectedTime, setSelectedTime] = useState('1회 19:30');
  const [activeTab, setActiveTab] = useState('공연정보');
  const [liked, setLiked] = useState(false);

  const year = 2025;
  const month = 7;
  const totalDays = 31;
  const firstDay = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, []);

  const ticketInfo = {
    image: '../images/포스터.png',
    title: '2025 박보검 팬미팅',
    subtitle: '[ BE WITH YOU ] IN SEOUL',
    location: '잠실실내체육관',
    address: '서울특별시 송파구 올림픽로 25',
    dateRange: '2025.08.01 ~ 2025.08.02',
    runtime: '150분',
    price: '55,000원 ~ 88,000원',
    promoter: '뮤직엔터컴퍼니',
    ageLimit: '전체관람가',
    contact: '1588-1234',
    serviceFee: '1,000원'
  };

  const handleReservation = () => {
    // localStorage 저장
    localStorage.setItem('selectedDate', selectedDate);
    localStorage.setItem('selectedTime', selectedTime);

    // 새창 열기
    const width = 1172;
    const height = 812;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/seat',
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=no`
    );

    if (popup) popup.focus();
  };

  return (
    <div className="flex flex-col lg:flex-row justify-center gap-6 p-6 bg-white text-[#222]">
      <div className="flex flex-col gap-4 w-full lg:w-[600px]">
        {/* 카드 1 */}
        <div className="rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex gap-6 items-start">
            <img src={ticketInfo.image} alt="concert" className="w-40 h-40 object-cover rounded-lg" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {ticketInfo.title}
                </h2>
                <button onClick={() => setLiked(!liked)} className="text-gray-400 hover:text-red-500 text-xl">
                  {liked ? <AiFillHeart className="text-red-500" /> : <AiOutlineHeart />}
                </button>
              </div>
              <p className="text-sm text-gray-500">{ticketInfo.subtitle}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <div>📍 {ticketInfo.location}</div>
                <div>📅 {ticketInfo.dateRange}</div>
                <div>⏱ {ticketInfo.runtime}</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 px-4 py-3 rounded-md flex justify-between items-center w-full">
            <span className="text-sm text-gray-500">가격</span>
            <span className="text-blue-600 font-semibold text-base">{ticketInfo.price}</span>
          </div>
        </div>

        {/* 카드 2: 탭 */}
        <div className="rounded-2xl p-6">
          <div className="flex space-x-6 border-b border-gray-200 mb-4 text-sm font-medium">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`pb-2 ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[200px] text-sm text-[#444]">
            <div className="space-y-6">
              <h3 className="font-semibold text-base mb-2">콘서트 정보</h3>
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-gray-500 mr-4">장소</span> {ticketInfo.location}</div>
                <div><span className="text-gray-500 mr-4">주최</span> {ticketInfo.promoter}</div>
                <div><span className="text-gray-500 mr-4">주소</span> {ticketInfo.address}</div>
                <div><span className="text-gray-500 mr-4">문의</span> {ticketInfo.contact}</div>
                <div><span className="text-gray-500 mr-4">수용인원</span> 12,000명</div>
                <div><span className="text-gray-500 mr-4">관람연령</span> {ticketInfo.ageLimit}</div>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-gray-500 mr-4">공연시간</span> {ticketInfo.runtime} (인터미션 포함)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사이드 예약 영역 */}
      <div className="w-full lg:w-96 rounded-2xl p-6 shadow-md">
        <h3 className="text-base font-semibold mb-3">관람일 선택</h3>
        <div className="flex justify-between items-center mb-2">
          <button className="text-gray-400" disabled>&lt;</button>
          <span className="font-semibold text-gray-800">{selectedDate.slice(0, 7).replace('-', '년 ') + '월'}</span>
          <button className="text-gray-400" disabled>&gt;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm mb-4 place-items-center font-semibold">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-800'}>
              {d}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            const date = `2025-08-${String(day).padStart(2, '0')}`;
            const isAvailable = ['2025-08-01', '2025-08-02'].includes(date);
            const baseStyle = "w-8 h-8 flex items-center justify-center rounded-full text-sm leading-none";

            return day ? (
              <button
                key={day}
                className={`${baseStyle} ${
                  selectedDate === date
                    ? 'bg-blue-500 text-white'
                    : isAvailable
                    ? 'hover:bg-gray-200 text-black'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                onClick={() => isAvailable && setSelectedDate(date)}
                disabled={!isAvailable}
              >
                {day}
              </button>
            ) : (
              <div key={`empty-${idx}`} className="w-8 h-8" />
            );
          })}
        </div>

        <h3 className="text-base font-semibold mb-2">회차 선택</h3>
        <div className="space-y-2 mb-4">
          {['1회 19:30', '2회 16:00'].map((time) => {
            const isSelected = selectedTime === time;
            return (
              <button
                key={time}
                className={`w-full rounded-md px-4 py-2 flex justify-between items-center text-sm ${
                  isSelected ? 'bg-blue-400' : 'bg-gray-100 hover:bg-blue-100'
                }`}
                onClick={() => setSelectedTime(time)}
              >
                <span className="text-black">{time}</span>
                <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                  {isSelected ? '선택됨' : '예매 가능'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-sm text-gray-600 mb-2">선택 정보</div>
        <div className="text-sm font-medium mb-4">{selectedDate} {selectedTime}</div>
        <div className="text-sm font-semibold text-blue-600 mb-4">{ticketInfo.price}</div>

        {/* 예약하기 버튼 */}
        <button
          className="w-full bg-blue-600 text-white rounded-md py-3 font-semibold hover:bg-blue-700"
          onClick={handleReservation}
        >
          예약하기
        </button>
      </div>
    </div>
  );
};

export default ReservationDetail;
