'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../globals.css';
import { useParams, useRouter } from 'next/navigation';
import { useConcertData, useAuth, useFavorite } from './hooks';
import { ConcertHeader, ConcertInfoTabs, BookingBox } from './components';
import OneTicketModal from '@/app/modal/OneTicketModal';
import apiClient from '@/lib/apiClient';
import { UserTicket } from '@/types/ticket';
import ChatbotModal from '@/app/layout/ChatbotModal';

const ConcertDetail = () => {
  const { slug } = useParams();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState('공연정보');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isDuplicateBooking, setIsDuplicateBooking] = useState(false);
  const [modalMode, setModalMode] = useState<'duplicate' | 'limit' | null>(null);
  const [checkedDuplicate, setCheckedDuplicate] = useState(false); 
  const router = useRouter();

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

  useEffect(() => {
    if (concert?.start_date) {
      setSelectedDate(concert.start_date);
    }
  }, [concert]);

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!concert || !userId) return;

      // 로딩 중에는 중복 체크를 지연시킴
      setTimeout(async () => {
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
      }, 1000); // 1초 지연
    };

    checkDuplicate();
  }, [concert?.id, userId]);

  // 중복 검사 후 1인 1매 안내 띄움 (중복 아닌 경우만)
  useEffect(() => {
    if (concert && checkedDuplicate && !isDuplicateBooking) {
      setModalMode('limit');
      setShowLimitModal(true);
    }
  }, [concert, checkedDuplicate, isDuplicateBooking]);

  let seatPopup: Window | null = null;

  const handleReservation = () => {

    if (!userId) {
      router.push('/login');
      return;
    }

    if (isDuplicateBooking) {
      setModalMode('duplicate');
      setShowLimitModal(true);
      return;
    }

    proceedToSeatSelection();
  };

  const proceedToSeatSelection = () => {
    if (!concert) return;

    localStorage.setItem('concertId', concert.id);
    localStorage.setItem('concertTitle', concert.title);
    localStorage.setItem('venueId', concert.venue_id);
    localStorage.setItem('selectedDate', selectedDate);
    localStorage.setItem('selectedTime', selectedTime);
    localStorage.setItem('bookingFee', concert.booking_fee.toString());

    const width = 1172,
      height = 812;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    if (seatPopup && !seatPopup.closed) {
      seatPopup.location.reload();
      seatPopup.focus();
      return;
    }

    seatPopup = window.open(
      '/seat',
      '_blank',
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=no`
    );

    if (seatPopup) seatPopup.focus();
  };

  // 달력 아래로 내리는 애니메이션
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
    <div className="p-6 bg-white text-[#222] max-w-[1200px] mx-auto pt-40">
      {showLimitModal && modalMode && (
        <OneTicketModal
          mode={modalMode}
          onClose={() => {
            setShowLimitModal(false);
            const currentMode = modalMode;
            setModalMode(null);
            if (currentMode === 'limit' && !isDuplicateBooking) {
            }
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[600px_1fr] gap-20">
       {/* 콘서트 헤더 */}
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
              {/* 콘서트 정보 탭 */}
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

        {/* 오른쪽 예약 박스 */}
        <div className="sticky top-20 self-start">
          <BookingBox
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            onReservation={handleReservation}
            isDisabled={isDuplicateBooking}
            disabledReason={isDuplicateBooking ? '이미 예매한 공연입니다.' : undefined}
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
      <ChatbotModal />
    </div>
  );
};

export default ConcertDetail;
