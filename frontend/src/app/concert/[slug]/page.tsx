'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../globals.css';
import { useParams, useRouter } from 'next/navigation';
import { useConcertData, useAuth, useFavorite } from './hooks';
import { ConcertHeader, ConcertInfoTabs, BookingBox } from './components';
import OneTicketModal from '@/app/modal/OneTicketModal';
import apiClient from '@/lib/apiClient';
import { UserTicket } from '@/types/ticket';

const ConcertDetail = () => {
  const { slug } = useParams();
  const router = useRouter(); 
  const seatPopupRef = useRef<Window | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState('공연정보');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [modalMode, setModalMode] = useState<'duplicate' | 'limit' | null>(null);
  const [isDuplicateBooking, setIsDuplicateBooking] = useState(false);
  const [checkedDuplicate, setCheckedDuplicate] = useState(false);

  // 커스텀 훅들 사용
  const { concert, policies, ticketInfo, loading, error } = useConcertData();
  const { userId } = useAuth();
  const { liked, favoriteLoading, handleFavoriteToggle } = useFavorite(concert, userId);

  const calendarDays = useMemo(() => {
    if (!concert?.start_date) return [];
    const start = new Date(concert.start_date);
    const year = start.getFullYear();
    const month = start.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: Array<number | null> = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [concert?.start_date]);

  // 초기 날짜 설정
  useEffect(() => {
    if (concert?.start_date) {
      setSelectedDate(concert.start_date);
    }
  }, [concert]);

  // 진입 시 중복 예매 여부 확인 (1초 지연 후)
  useEffect(() => {
    if (!concert || !userId) return;

  const checkDuplicate = async () => {
    try {
      const res = await apiClient.getUserTickets(userId);
      const tickets: UserTicket[] = res.data?.tickets ?? [];

      const hasTicketForConcert = tickets.some(
        (ticket) => ticket.concert?.id === concert.id
      );

      if (hasTicketForConcert) {
        setIsDuplicateBooking(true);
        setModalMode('duplicate');
        setShowLimitModal(true);
      }
    } catch (err) {
      console.error('중복 티켓 확인 실패:', err);
    } finally {
      setCheckedDuplicate(true);
    }
  };

  // 즉시 한 번 실행
  checkDuplicate();

  // 1초 후에도 한 번 더 실행
  const timer = setTimeout(checkDuplicate, 1000);

  return () => clearTimeout(timer); // cleanup
}, [concert?.id, userId]);

// 중복 아닌 경우 모달 띄우기
useEffect(() => {
  if (concert && checkedDuplicate && !isDuplicateBooking) {
    setModalMode('limit');
    setShowLimitModal(true);
  }
}, [concert?.id, checkedDuplicate, isDuplicateBooking]);

  // 예매 버튼 클릭 시 실시간 중복 검사 또는 로그인 확인
  const handleReservation = async () => {
    if (!concert) return;

    // 로그인 안 했을 경우 로그인 페이지로 이동
    if (!userId) {
      router.push('/login');
      return;
    }

    if (!selectedTime) {
    alert('시간을 선택해주세요.');
    return;
    }

    try {
      const res = await apiClient.getUserTickets(userId);
      const tickets: UserTicket[] = res.data?.tickets ?? [];

      const hasTicket = tickets.some(
        (ticket) => ticket.concert?.id === concert.id 
      );

      if (hasTicket) {
        setModalMode('duplicate');
        setShowLimitModal(true);
        return;
      }

      proceedToSeatSelection();
    } catch (err) {
      console.error('예매 상태 확인 실패:', err);
      alert('예매 정보를 확인할 수 없습니다.');
    }
  };

  // 좌석 선택 페이지 팝업 (중복 방지)
const proceedToSeatSelection = () => {
  if (!concert) return;

  localStorage.setItem('concertId', concert.id);
  localStorage.setItem('concertTitle', concert.title);
  localStorage.setItem('venueId', concert.venue_id);
  localStorage.setItem('selectedDate', selectedDate);
  localStorage.setItem('selectedTime', selectedTime);
  localStorage.setItem('bookingFee', concert.booking_fee.toString());

  const width = 1172;
  const maxHeight = 812;
  const screenHeight = window.innerHeight;

  const height = Math.min(screenHeight - 100, maxHeight); // 최소 여유 확보
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  if (seatPopupRef.current && !seatPopupRef.current.closed) {
    seatPopupRef.current.location.reload();
    seatPopupRef.current.focus();
    return;
  }

  seatPopupRef.current = window.open(
    '/seat',
    '_blank',
    `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=yes`
  );

  if (seatPopupRef.current) seatPopupRef.current.focus();
};

  // 탭 애니메이션 처리
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsHeight, setTabsHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (tabsRef.current) {
      setTabsHeight(tabsRef.current.scrollHeight);
    }
  }, [activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">콘서트 정보를 불러오는 중...</p>
        <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
      </div>
    </div>
  );
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!concert || !ticketInfo) return <div className="p-6">콘서트 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="p-6 bg-white text-[#222] max-w-[1200px] mx-auto pt-20">
      {showLimitModal && modalMode && (
        <OneTicketModal
          mode={modalMode}
          onClose={() => {
            setShowLimitModal(false);
            setModalMode(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[600px_1fr] gap-20">
        <div>
          <ConcertHeader
            ticketInfo={ticketInfo}
            liked={liked}
            favoriteLoading={favoriteLoading}
            onFavoriteToggle={handleFavoriteToggle}
          />

          <div
            style={{
              height: tabsHeight ? `${tabsHeight}px` : 'auto',
              transition: 'height 0.4s ease',
              overflow: 'hidden',
            }}
          >
            <div ref={tabsRef}>
              <ConcertInfoTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                ticketInfo={ticketInfo}
                concert={concert}
                policies={policies}
              />
            </div>
          </div>
        </div>

        <div className="sticky top-10 h-fit">
          <BookingBox
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onReservation={handleReservation}
            concert={{
              start_date: concert.start_date,
              start_time: concert.start_time,
              ticket_open_at: concert.ticket_open_at,
            }}
            price={ticketInfo.price}
            calendarDays={calendarDays}
          />
        </div>
      </div>
    </div>
  );
};

export default ConcertDetail;
