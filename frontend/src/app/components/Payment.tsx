'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';
import Link from 'next/link';
import { TicketMintResult } from '@/types/ticket';
import ConfirmModal from '@/app/modal/ConfirmModal';

interface PaymentProps {
  seatInfo: string | null;
  concertId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  onPaymentComplete: (result: TicketMintResult) => void
}

export default function Payment({
  seatInfo,
  concertId,
  selectedDate,
  selectedTime,
  onPaymentComplete,
}: PaymentProps) {
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [bookingFee, setBookingFee] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const total = ticketPrice + bookingFee;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const storedPrice = localStorage.getItem('concertPrice');
    setTicketPrice(storedPrice ? Number(storedPrice) : 0);

    const storedFee = localStorage.getItem('bookingFee');
    setBookingFee(storedFee ? Number(storedFee) : 0);

    const expiresAtString = localStorage.getItem('holdExpiresAt');
    if (expiresAtString) {
      const expires = new Date(expiresAtString).getTime();
      setExpiresAt(expires);
    }

    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      console.log('🔍 사용자 정보 로딩 시작:', { hasToken: !!token });
      
      if (token) {
        try {
          const res = await apiClient.getUserWithToken(token);
          console.log('📥 사용자 정보 API 응답:', res);
          
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            console.log('✅ 사용자 정보 설정 완료:', res.data.user);
          } else {
            console.error('❌ 사용자 정보 로딩 실패:', res);
            localStorage.removeItem('accessToken');
            alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
          }
        } catch (error) {
          console.error('❌ 사용자 정보 API 오류:', error);
          localStorage.removeItem('accessToken');
          alert('사용자 정보를 불러오는 중 오류가 발생했습니다. 다시 로그인해주세요.');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('❌ 액세스 토큰이 없습니다.');
        setLoading(false);
        alert('로그인이 필요합니다.');
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.floor((expiresAt - now) / 1000);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        alert('결제 시간이 만료되었습니다.');
        location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const goToSeatPage = () => {
    localStorage.removeItem('selectedZoneId');
    localStorage.removeItem('selectedRow');
    localStorage.removeItem('selectedCol');
    localStorage.removeItem('seatInfo');
    window.location.href = '/seat';
  };

  const handlePayment = async () => {
    const row = Number(localStorage.getItem('selectedRow'));
    const col = Number(localStorage.getItem('selectedCol'));
    const sectionId = localStorage.getItem('selectedZoneId');
    const userId = user?.id;
    const price = ticketPrice + bookingFee;

    console.log('🔍 결제 요청 정보:', {
      concertId,
      row,
      col,
      sectionId,
      seatNumber,
      userId,
      price,
      user: user
    });

    if (!concertId || row === undefined || col === undefined || !userId || !price) {
      console.error('❌ 결제 정보 부족:', {
        concertId: !!concertId,
        row: row !== undefined,
        col: col !== undefined,
        userId: !!userId,
        price: !!price
      });
      alert('결제 정보가 부족합니다.');
      return;
    }

    const payload = {
      concertId,
      sectionId,
      row,
      col,
      seatNumber: seatInfo || '',
      userId,
      price: Number(price),
    };

    console.log('📤 결제 API 요청 페이로드:', payload);

    try {
      const res = await apiClient.post<TicketMintResult>('/tickets', payload);
      console.log('📥 결제 API 응답:', res);
      
      if (res.success && res.data) {
        const { token_id, tx_hash, metadata_uri, seat_number } = res.data;
        onPaymentComplete({ token_id, tx_hash, metadata_uri, seat_number });
      } else {
        console.error('❌ 결제 실패 응답:', res);
        alert('결제 실패: ' + (res.message || res.error || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('결제 요청 중 오류:', err);
      alert('결제 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="bg-white text-sm text-gray-800">
      <div className="flex w-full max-w-[1200px] mx-auto h-[calc(105vh-80px)]">
        {/* 왼쪽 */}
        <div className="flex-1 bg-white border-r border-gray-200 px-8 py-10 overflow-y-auto">
          <div className="flex justify-center items-center gap-8 mb-8">
            {/* STEP1 */}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowConfirmModal(true);
              }}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-600"
            >
              <span className="px-4 py-1 text-base rounded-full bg-gray-200 font-bold">STEP1</span>
              <span className="text-lg font-medium">좌석 선택</span>
            </Link>

            <div className="text-gray-300 text-xl font-bold">{'>'}</div>

            {/* STEP2 */}
            <div className="flex items-center space-x-2 text-blue-600">
              <span className="px-4 py-1 text-base rounded-full bg-blue-600 text-white font-bold">STEP2</span>
              <span className="text-lg font-semibold">가격 선택</span>
            </div>
          </div>

          <h2 className="text-base font-bold mb-4">수령방법을 선택하세요</h2>
          <label className="flex items-center gap-2 mb-6">
            <input type="radio" checked disabled className="accent-blue-500" />
            현장수령
            <p className="text-xs text-gray-500 ml-2">
              공연 당일 현장 교부처에서 예매번호 및 본인 확인 후 티켓을 수령하여 입장 가능합니다.
            </p>
          </label>

          {/* 주문자 정보 */}
          <div className="border p-4 rounded mb-6 border-gray-300">
            <h3 className="font-semibold mb-2">주문자정보</h3>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm">이름</span>
              <span className="font-medium text-sm">{user?.name}</span>
              <span className="text-sm ml-6">이메일</span>
              <span className="font-medium text-sm">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <span className="text-red-500">*</span> 입력하신 정보는 공연장에서 예매확인을 위해 사용될 수 있습니다.
            </p>
          </div>

          {/* 예매자 동의 */}
          <div className="border border-gray-300 p-4 rounded">
            <h3 className="font-semibold mb-2">예매자 동의</h3>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" className="accent-blue-500" />
              [필수] 예매 및 취소 수수료/취소기한을 확인하였으며 동의합니다.
            </label>
            <div className="border border-gray-200 rounded bg-gray-50 text-center text-sm">
              <div className="grid grid-cols-2 font-medium border-b bg-white py-2">
                <span>취소일</span>
                <span>취소수수료</span>
              </div>
              <div className="grid grid-cols-2 border-b py-2">
                <span>2025.07.02 ~ 2025.07.09</span>
                <span>없음</span>
              </div>
              <div className="grid grid-cols-2 border-b py-2">
                <span>2025.07.10 ~ 2025.07.12</span>
                <span>티켓금액의 10%</span>
              </div>
              <div className="grid grid-cols-2 border-b py-2">
                <span>2025.07.13 ~ 2025.07.16</span>
                <span>티켓금액의 20%</span>
              </div>
              <div className="grid grid-cols-2 py-2">
                <span>2025.07.17 ~ 2025.07.18</span>
                <span>티켓금액의 30%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 */}
        <div className="w-[320px] bg-white px-6 py-10 border-l border-gray-200 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-center mb-6">
            <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} />
          </div>

          <div className="border p-2 mb-4">
            <div className="text-sm font-bold">{concertId}</div>
            <div className="text-xs text-gray-500 mt-1">{selectedDate} {selectedTime}</div>
            <hr className="my-2" />
            <div className="text-sm">총 1석 선택</div>
            <div className="text-sm">{seatInfo}</div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">결제금액</h3>
            <div className="text-xs border px-3 py-2 space-y-1">
              <div className="flex justify-between">
                <span>티켓금액</span>
                <span>{ticketPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>기본가</span>
                <span>{ticketPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span>공연예매권</span>
                <span>0원</span>
              </div>
              <div className="flex justify-between">
                <span>예매수수료</span>
                <span>{bookingFee.toLocaleString()}원</span>
              </div>
            </div>
            <div className="flex justify-between mt-3 font-bold border-t pt-2 text-lg text-blue-600">
              <span>총 결제금액</span>
              <span>{total.toLocaleString()}원</span>
            </div>
          </div>

          <div className="text-xs text-blue-500 mt-4 space-y-1">
            <p>※ 취소기한: {selectedDate} 전날 23:59까지</p>
            <p>※ 취소수수료: 티켓금액의 0~30%</p>
          </div>

          <div className="mt-6 text-center flex flex-col items-center space-y-2">
            {/* 결제하기 버튼 */}
            <button
              onClick={handlePayment}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded text-sm w-full"
            >
              결제하기
            </button>

            {/* 이전으로 버튼 */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="text-sm text-gray-500 underline"
            >
              이전으로
            </button>

            {/* 남은 시간 */}
            {expiresAt && (
              <div className="text-center text-sm text-red-600 font-semibold">
                ⏳ 남은 시간: {Math.floor(remainingSeconds / 60)}분 {remainingSeconds % 60}초
              </div>
            )}
          </div>
        </div>
      </div>
      {showConfirmModal && (
        <ConfirmModal
          message="현재 선택한 좌석 정보가 삭제됩니다. 이동하시겠습니까?"
          onConfirm={goToSeatPage}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </main>
  );
}
