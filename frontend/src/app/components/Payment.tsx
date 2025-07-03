'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import apiClient from '@/lib/apiClient';

export default function Payment() {
  const router = useRouter();

  const [concert, setConcert] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<string | null>(null);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [bookingFee, setBookingFee] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const total = ticketPrice + bookingFee;

  useEffect(() => {
    const concertData = localStorage.getItem('concert');
    if (concertData) setConcert(JSON.parse(concertData));
    else {
      const title = localStorage.getItem('concertTitle');
      if (title) setConcert({ title });
    }

    setSelectedDate(localStorage.getItem('selectedDate'));
    setSelectedTime(localStorage.getItem('selectedTime'));
    setSelectedSeatInfo(localStorage.getItem('selectedSeatInfo'));

    const storedPrice = localStorage.getItem('concertPrice');
    setTicketPrice(storedPrice ? Number(storedPrice) : 0);

    const storedFee = localStorage.getItem('bookingFee');
    setBookingFee(storedFee ? Number(storedFee) : 0);

    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await apiClient.getUserWithToken(token);
          if (res.success && res.data?.user) setUser(res.data.user);
          else localStorage.removeItem('accessToken');
        } catch {
          localStorage.removeItem('accessToken');
        } finally {
          setLoading(false);
        }
      } else setLoading(false);
    };

    fetchUser();
  }, []);

  const handlePayment = async () => {
    const concertId = localStorage.getItem('concertId');
    const row = Number(localStorage.getItem('selectedRow'));
    const col = Number(localStorage.getItem('selectedCol'));
    const sectionId = localStorage.getItem('selectedZoneId');
    const seatNumber = selectedSeatInfo || '';
    const userId = user?.id;
    const price = ticketPrice + bookingFee;

    if (!concertId || row === undefined || col === undefined || !userId || !price) {
      alert('결제 정보가 부족합니다.');
      return;
    }

    const payload = {
      concertId,
      sectionId,
      row,
      col,
      seatNumber,
      userId,
      price: Number(price),
    };

    try {
      const res = await apiClient.post('/tickets', payload);
      if (res.success) router.push('/complete');
      else alert('결제 실패: ' + res.message);
    } catch (err) {
      console.error('결제 요청 중 오류:', err);
      alert('결제 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-white text-sm text-gray-800">
      <div className="flex w-full max-w-[1200px] mx-auto">
        {/* 왼쪽 */}
        <div className="flex-1 bg-white border-r border-gray-200 px-8 py-10">
          <div className="text-xs text-gray-500 mb-6">
            <span className="px-2 py-1 rounded-full border bg-gray-100">STEP1 좌석 선택</span>
            <span className="mx-1">&gt;</span>
            <span className="px-2 py-1 rounded-full border bg-gray-100">STEP2 가격 선택</span>
            <span className="mx-1">&gt;</span>
            <span className="px-2 py-1 rounded-full border bg-green-100 text-green-700 font-semibold">STEP3 배송/결제</span>
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
          <div className="border p-4 rounded mb-6">
            <h3 className="font-semibold mb-2">주문자정보</h3>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm">이름</span>
              <span className="font-medium text-sm">{user?.name}</span>
              <span className="text-sm ml-6">연락처 <span className="text-red-500">*</span></span>
              <div className="flex gap-1">
                <input type="text" placeholder="010" className="border p-2 rounded w-16" />
                <input type="text" placeholder="1234" className="border p-2 rounded w-16" />
                <input type="text" placeholder="5678" className="border p-2 rounded w-16" />
              </div>
              <span className="text-sm ml-6">이메일 <span className="text-red-500">*</span></span>
              <span className="font-medium text-sm">{user?.email}</span>
            </div>
          </div>

          {/* 예매자 동의 */}
          <div className="border p-4 rounded">
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
        <div className="w-[320px] bg-white px-6 py-10 border-l border-gray-200 flex flex-col justify-between">
          <div className="flex justify-center mb-6">
            <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} />
          </div>

          <div className="border p-2 mb-4">
            <div className="text-sm font-bold">{concert?.title}</div>
            <div className="text-xs text-gray-500 mt-1">{selectedDate} {selectedTime}</div>
            <hr className="my-2" />
            <div className="text-sm">총 1석 선택</div>
            <div className="text-sm">{selectedSeatInfo}</div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">결제금액</h3>
            <div className="text-xs border px-3 py-2 space-y-1">
              <div className="flex justify-between">
                <span>티켓금액</span>
                <span>{ticketPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>기본가</span>
                <span>{ticketPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>공연예매권</span>
                <span>0원</span>
              </div>
              <div className="flex justify-between">
                <span>예매수수료</span>
                <span>{bookingFee.toLocaleString()}원</span>
              </div>
            </div>
            <div className="flex justify-between mt-3 font-bold border-t pt-2 text-lg text-green-600">
              <span>총 결제금액</span>
              <span>{total.toLocaleString()}원</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4 space-y-1">
            <p>※ 취소기한: {selectedDate} 전날 23:59까지</p>
            <p>※ 취소수수료: 티켓금액의 0~30%</p>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handlePayment}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded text-sm"
            >
              결제하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
