'use client';

import { useEffect, useState } from 'react';
import { MdCake, MdEmail, MdCalendarToday } from 'react-icons/md';
import { FaTicketAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface User {
  name: string;
  email: string;
  birth: string;
  createdAt: string;
  ticketCount: number;
}

interface ReservationItem {
  id: number;
  title: string;
  start_date: string;
  start_time: string;
  location: string;
  price: string;
  bookedAt: string;
  status: '예약완료' | '취소완료';
  ticketType: string;
  quantity: number;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'전체' | '예약완료' | '취소'>('전체');
  const itemsPerPage = 3;

useEffect(() => {
  const fetchUserDashboard = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.warn('accessToken이 없습니다');
      router.replace('/login');
      return;
    }

    try {
      const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('/auth/user 응답 상태:', res1.status);

      if (!res1.ok) {
        const text = await res1.text();
        console.error('응답 실패:', res1.status, text);
        
        // 토큰이 유효하지 않은 경우
        if (res1.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.replace('/login?error=invalid_token');
          return;
        }
        return;
      }

      const userData = await res1.json();
      console.log('유저 정보:', userData);
      console.log('유저 정보 (JSON):', JSON.stringify(userData, null, 2));

      const userId = userData.data?.user?.id;
      if (!userId) {
        console.warn('userId를 가져올 수 없습니다');
        return;
      }

      const res2 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/dashboard/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('/users/dashboard 응답 상태:', res2.status);

      if (!res2.ok) {
        const text = await res2.text();
        console.error('대시보드 실패:', res2.status, text);
        return;
      }

      const dashboardData = await res2.json();
      console.log('대시보드:', dashboardData);

      if (dashboardData.success && dashboardData.data) {
        setUser(dashboardData.data.profile);
        setReservations(dashboardData.data.reservations || []);
      } else {
        setUser(null);
        setReservations([]);
      }
    } catch (err) {
      console.error('전체 요청 실패:', err);
      setUser(null);
      setReservations([]);
    }
  };

  fetchUserDashboard();
}, [router]);

  const filtered = reservations.filter((item) => {
    if (filter === '전체') return true;
    if (filter === '예약완료') return item.status === '예약완료';
    if (filter === '취소') return item.status === '취소완료';
  });

  const pageCount = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-20 pt-20">
      <h1 className="text-2xl font-bold mb-1">마이페이지</h1>
      <p className="text-gray-500 mb-6">회원정보와 예매내역을 확인하세요</p>

      {user && (
        <div className="w-full flex justify-center px-4">
            <div className="max-w-[1024px] w-full flex justify-between gap-8">
            {/* 왼쪽 회원 정보 카드 */}
            <div className="w-[320px] px-4 py-5 bg-white rounded-xl shadow flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border bg-gray-100 flex items-center justify-center text-xs text-gray-500 mb-2">
                profile
                </div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <div className="w-full text-sm text-gray-800 space-y-4 mt-6">
                <div className="pt-2 flex items-start gap-2">
                    <MdEmail className="w-5 h-5 text-indigo-500 mt-1" />
                    <div>
                    <p className="text-gray-500">이메일</p>
                    <p>{user.email}</p>
                    </div>
                </div>
                <hr />
                <div className="pt-2 flex items-start gap-2">
                    <MdCake className="w-5 h-5 text-indigo-500 mt-1" /> 
                    <div>
                        <p className="text-gray-500">생년월일</p>
                        <p>{user.birth}</p>
                    </div>
                </div>
                <hr />
                <div className="pt-2 flex items-start gap-2">
                    <MdCalendarToday className="w-5 h-5 text-indigo-500 mt-1" />
                    <div>
                    <p className="text-gray-500">가입일</p>
                    <p>{user.createdAt.split('T')[0]}</p>
                    </div>
                </div>
                <hr />
                <div className="pt-2 flex items-start gap-2">
                    <FaTicketAlt className="w-5 h-5 text-indigo-500 mt-1" />
                    <div>
                    <p className="text-gray-500">총 예매횟수</p>
                    <p>{user.ticketCount}회</p>
                    </div>
                </div>
                </div>
                <button className="w-full mt-2 p-2 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                회원정보 수정
                </button>
            </div>

            {/* 오른쪽 예매 내역 */}
            <div className="flex-1 min-w-0">
                <div className="p-6 bg-white rounded-xl shadow max-w-[700px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">최근 예매/취소 내역</h3>
                    <div className="flex gap-2">
                    {(['전체', '예약완료', '취소'] as const).map((f) => (
                        <button
                        key={f}
                        onClick={() => {
                            setFilter(f);
                            setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-full border text-sm ${
                            filter === f
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 border-gray-300'
                        }`}
                        >
                        {f}
                        </button>
                    ))}
                    </div>
                </div>

                {currentItems.map((item) => (
                    <div
                    key={item.id}
                    className="flex justify-between items-start border rounded-lg p-4 mb-4"
                    >
                    <div className="flex gap-4">
                        <div className="w-16 h-20 bg-gray-200 rounded" />
                        <div>
                        <p className="font-semibold mb-1">{item.title}</p>
                        <p className="text-sm text-gray-500">
                            {item.start_date} {item.start_time}
                        </p>
                        <p className="text-sm text-gray-500">{item.location}</p>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <span
                            className={`px-2 py-0.5 rounded-full text-white text-xs ${
                                item.status === '예약완료'
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                            }`}
                            >
                            {item.status}
                            </span>
                            <span className="text-gray-700">
                            {item.ticketType} {item.quantity}매
                            </span>
                        </div>
                        <div className="mt-2 space-x-1">
                            <button className="px-3 py-1 bg-gray-200 text-sm rounded">
                            상세보기
                            </button>
                            <button
                            className={`px-3 py-1 text-sm rounded ${
                                item.status === '예약완료'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}
                            >
                            {item.status === '예약완료' ? '취소하기' : '환불완료'}
                            </button>
                        </div>
                        </div>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-semibold mb-1">{item.price}</p>
                        <p className="text-xs text-gray-500">
                        예매일: {item.bookedAt}
                        </p>
                    </div>
                    </div>
                ))}

                {pageCount > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                    {Array.from({ length: pageCount }, (_, i) => (
                        <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 text-sm rounded border ${
                            currentPage === i + 1
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700'
                        }`}
                        >
                        {i + 1}
                        </button>
                    ))}
                    </div>
                )}

                {filtered.length === 0 && (
                    <p className="text-gray-500 mt-8 text-center">
                    예매한 내역이 없습니다.
                    </p>
                )}
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}
