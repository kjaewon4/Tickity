"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import '../../globals.css';
import { useParams } from 'next/navigation';

interface Concert {
  id: string;
  title: string;
  main_performer: string;
  start_date: string;
  start_time: string;
  poster_url: string;
  venue_id: string;
  running_time: string;
  promoter: string;
  customer_service: string;
  age_rating: string;
  booking_fee: number;
  valid_from: string;
  valid_to: string;
  venues: {
    name: string;
    address: string;
    capacity: number;
  };
}

interface SeatPrice {
  seat_grade_id: string;
  grade_name: string;
  price: number;
  total_seats: number;
}

interface CancellationPolicy {
  period_desc: string;
  fee_desc: string;
}

const tabs = ['공연정보', '판매정보'];

const SimpleConcertDetail = () => {
  const { concertId } = useParams();
  const [concert, setConcert] = useState<Concert | null>(null);
  const [seatPrices, setSeatPrices] = useState<SeatPrice[]>([]);
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [liked, setLiked] = useState(false);
  const [rounds, setRounds] = useState<{ round: number; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!concertId) {
      setError('유효하지 않은 콘서트 URL입니다.');
      setLoading(false);
      return;
    }

    const fetchConcert = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}`);
        const json = await res.json();
        
        if (json.success && json.data) {
          setConcert(json.data.concert);
          setSeatPrices(json.data.seat_prices);
          setPolicies(json.data.cancellation_policies);
          setRounds(json.data.rounds);
        } else {
          setError('콘서트 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('콘서트 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcert();
  }, [concertId]);

  const ticketInfo = useMemo(() => {
    if (!concert || !seatPrices.length) return null;

    const minPrice = Math.min(...seatPrices.map(s => s.price));
    const maxPrice = Math.max(...seatPrices.map(s => s.price));

    return {
      image: concert.poster_url,
      title: concert.title,
      subtitle: `[ ${concert.main_performer} ] IN SEOUL`,
      location: concert.venues?.name || '',
      address: concert.venues?.address || '',
      dateRange: `${concert.valid_from} ~ ${concert.valid_to}`,
      runtime: concert.running_time,
      price: `${minPrice.toLocaleString()}원 ~ ${maxPrice.toLocaleString()}원`,
      promoter: concert.promoter,
      ageLimit: concert.age_rating,
      contact: concert.customer_service,
      serviceFee: `${concert.booking_fee.toLocaleString()}원`
    };
  }, [concert, seatPrices]);

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

          {activeTab === '공연정보' ? (
            <div className="min-h-[200px] text-sm text-[#444] space-y-4">
              <h3 className="font-semibold text-base mb-2">콘서트 정보</h3>
              <div className="grid grid-cols-2 gap-y-2">
                <div><span className="text-gray-500 mr-4">장소</span> {ticketInfo.location}</div>
                <div><span className="text-gray-500 mr-4">주최</span> {ticketInfo.promoter}</div>
                <div><span className="text-gray-500 mr-4">주소</span> {ticketInfo.address}</div>
                <div><span className="text-gray-500 mr-4">문의</span> {ticketInfo.contact}</div>
                <div><span className="text-gray-500 mr-4">수용인원</span> {concert.venues?.capacity?.toLocaleString()}명</div>
                <div><span className="text-gray-500 mr-4">관람연령</span> {ticketInfo.ageLimit}</div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-base mb-2">판매 정보</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">주최/기획</th>
                      <td className="w-1/4 p-3">{concert.organizer}</td>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">고객문의</th>
                      <td className="w-1/4 p-3">{concert.customer_service}</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">공연시간</th>
                      <td className="p-3">{concert.running_time}</td>
                      <th className="bg-gray-50 p-3 font-medium">관람등급</th>
                      <td className="p-3">{concert.age_rating}</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">주연</th>
                      <td className="p-3">{concert.main_performer}</td>
                      <th className="bg-gray-50 p-3 font-medium">공연장소</th>
                      <td className="p-3">{concert.venues.name}</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">예매수수료</th>
                      <td className="p-3">
                        {concert.booking_fee ? `장당 ${concert.booking_fee.toLocaleString()}원` : '없음'}
                      </td>
                      <th className="bg-gray-50 p-3 font-medium">배송료</th>
                      <td className="p-3">현장수령 무료, 배송 3,200원</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">유효기간/이용조건</th>
                      <td colSpan={3} className="p-3">
                        {concert.valid_from} 예매한 공연 날짜, 회차에 한해 이용 가능
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 판매자 정보 */}
              <h3 className="font-semibold text-base mb-2">판매자 정보</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full table-fixed text-left">
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">상호</th>
                      <td className="w-1/4 p-3">{concert.seller_name}</td>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">대표자명</th>
                      <td className="w-1/4 p-3">{concert.seller_rep}</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">사업자등록번호</th>
                      <td className="p-3">{concert.seller_reg_no}</td>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">E-mail</th>
                      <td className="p-3">{concert.seller_email}</td>
                    </tr>
                    <tr>
                      <th className="bg-gray-50 p-3 font-medium">연락처</th>
                      <td className="p-3">{concert.seller_contact}</td>
                      <th className="w-1/4 bg-gray-50 p-3 font-medium">주소</th>
                      <td className="p-3">{concert.seller_address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 취소 수수료 정책 */}
              {policies.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-base mb-2">취소 수수료 정책</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left table-fixed text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-1/2 p-3 font-semibold border-b border-gray-200">취소일</th>
                          <th className="w-1/2 p-3 font-semibold border-b border-gray-200">취소수수료</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {policies.map((policy, idx) => (
                          <tr key={idx}>
                            <td className="p-3">{policy.period_desc}</td>
                            <td className="p-3">{policy.fee_desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 예약 박스 */}
      <div className="w-full lg:w-96 rounded-2xl p-6 shadow-md">
        <h3 className="text-base font-semibold mb-3">관람일 선택</h3>
        <div className="flex justify-between items-center mb-2">
          <button className="text-gray-400" disabled>&lt;</button>
          <span className="font-semibold text-gray-800">{selectedDate.slice(0, 7).replace('-', '년 ') + '월'}</span>
          <button className="text-gray-400" disabled>&gt;</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-sm mb-4 place-items-center font-semibold">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-800'}>{d}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="w-8 h-8" />;

            const baseDate = new Date(concert.start_date);
            const year = baseDate.getFullYear();
            const month = baseDate.getMonth() + 1; // 0-based → 1-based
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const isAvailable = date === concert.start_date;
            const isSelected = selectedDate === date;

            const baseStyle = "w-8 h-8 flex items-center justify-center rounded-full text-sm leading-none";

            return (
              <button
                key={day}
                className={`${baseStyle} ${isSelected ? 'bg-blue-500 text-white' : isAvailable ? 'hover:bg-gray-200 text-black' : 'text-gray-300 cursor-not-allowed'}`}
                onClick={() => isAvailable && setSelectedDate(date)}
                disabled={!isAvailable}
              >
                {day}
              </button>
            );
          })}
        </div>

        <h3 className="text-base font-semibold mb-2">회차 선택</h3>
        <div className="space-y-2 mb-4">
          {concert.round && (
            (() => {
              const label = `${concert.round}회 ${concert.start_time.slice(0, 5)}`;
              const isSelected = selectedTime === label;
              return (
                <button
                  className={`w-full rounded-md px-4 py-2 flex justify-between items-center text-sm ${isSelected ? 'bg-blue-400' : 'bg-gray-100 hover:bg-blue-100'}`}
                  onClick={() => setSelectedTime(label)}
                >
                  <span className="text-black">{label}</span>
                  <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {isSelected ? '선택됨' : '예매 가능'}
                  </span>
                </button>
              );
            })()
          )}
        </div>

        <div className="text-sm text-gray-600 mb-2">선택 정보</div>
        <div className="text-sm font-medium mb-4">{selectedDate} {selectedTime}</div>
        <div className="text-sm font-semibold text-blue-600 mb-4">{ticketInfo.price}</div>

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

export default SimpleConcertDetail; 