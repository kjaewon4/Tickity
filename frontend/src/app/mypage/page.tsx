'use client';

import { useEffect, useState } from 'react';
import { MdCake, MdEmail, MdCalendarToday } from 'react-icons/md';
import { FaTicketAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import ConfirmModal from '@/app/modal/ConfirmModal';

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
  gradeName: string;
  poster_url: string;
  seatId: string;
  tokenId: number;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'전체' | '예약완료' | '취소'>('전체');
  const itemsPerPage = 3;
  const [residentNumber, setResidentNumber] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCancelInfo, setPendingCancelInfo] = useState<{
    seatId: string;
    ticketId: string;
    tokenId: number;
  } | null>(null);

  const fetchUserDashboard = async () => {
    try {
      const userRes = await apiClient.getUser();
      const userId = userRes.data?.user?.id;
      if (!userId) {
        router.replace('/login');
        return;
      }

      const dashboardData = await apiClient.getUserDashboard(userId);
      const rrnData = await apiClient.getResidentNumber(userId);

      if (dashboardData.success && dashboardData.data) {
        const ticketCount = dashboardData.data.tickets?.length || 0;
        setUser({
          ...dashboardData.data.profile,
          ticketCount,
        });

        const ticketList: ReservationItem[] = dashboardData.data.tickets.map((ticket: any) => {
          const status: '예약완료' | '취소완료' = ticket.is_cancelled ? '취소완료' : '예약완료';

          return {
            id: ticket.id,
            title: ticket.concert.title,
            start_date: ticket.concert.start_date,
            start_time: ticket.concert.start_time,
            location: ticket.concert.venue_name || '장소 미정',
            price: `${ticket.purchase_price.toLocaleString()}`,
            bookedAt: ticket.created_at,
            status,
            ticketType: ticket.seat_number || '좌석 미정',
            gradeName: ticket.seat?.grade_name || '등급 미정',
            poster_url: ticket.concert.poster_url,
            seatId: ticket.seat_id,
            tokenId: ticket.nft_token_id,
          };
        });
        setReservations(ticketList);
      }

      if (rrnData.success && rrnData.data?.residentNumber) {
        const rrn = rrnData.data.residentNumber;
        const yearPrefix = rrn[6] === '1' || rrn[6] === '2' ? '19' : '20';
        const year = `${yearPrefix}${rrn.slice(0, 2)}`;
        const month = rrn.slice(2, 4);
        const day = rrn.slice(4, 6);
        setResidentNumber(`${year}년 ${parseInt(month)}월 ${parseInt(day)}일`);
        setGender(rrn[6] === '1' || rrn[6] === '3' ? 'male' : 'female');
      }
    } catch (err) {
      console.error('대시보드 로드 실패:', err);
      setUser(null);
      setReservations([]);
    }
  };

  const handleCancelConfirm = async () => {
    if (!pendingCancelInfo) return;
    const { seatId, ticketId, tokenId } = pendingCancelInfo;
    try {
      const res = await apiClient.cancelTicket(seatId, ticketId, tokenId);
      if (res.success) {
        alert('취소 완료!');
        await fetchUserDashboard();
      } else {
        alert(res.error || '티켓 취소 실패');
      }
    } catch (e: any) {
      alert(e.message || '오류 발생');
    } finally {
      setShowConfirmModal(false);
      setPendingCancelInfo(null);
    }
  };

  useEffect(() => {
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
    <div className="p-20 pt-20 pl-[150px]">
      <h1 className="text-4xl font-bold mb-2">마이페이지</h1>
      <p className="text-lg text-gray-500 mb-8">회원정보와 예매내역을 확인하세요</p>

      {/* ConfirmModal */}
      {showConfirmModal && pendingCancelInfo && (
        <ConfirmModal
          message={
            <>
              <p className="font-semibold">정말 이 티켓을 취소하시겠습니까?</p>
              <p className="text-sm text-gray-500 mt-1">취소 시 복구할 수 없으며 환불은 자동 정산됩니다.</p>
            </>
          }
          onConfirm={handleCancelConfirm}
          onCancel={() => {
            setShowConfirmModal(false);
            setPendingCancelInfo(null);
          }}
        />
      )}
      {user && (
        <div className="w-full flex flex-col gap-8">
          <div className="flex justify-start gap-16 w-full">
            <div className="w-[360px] px-6 py-6 bg-white rounded-xl shadow flex flex-col items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-sm text-gray-500 mb-3">
                {gender ? (
                  <img
                    src={gender === 'male' ? '/images/boy_profile.png' : '/images/girl_profile.png'}
                    alt="프로필 이미지"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  'profile'
                )}
              </div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <div className="w-full text-base text-gray-800 space-y-6 mt-6">
                <div className="pt-3 flex items-start gap-3">
                  <MdEmail className="w-6 h-6 text-indigo-500 mt-1" />
                  <div>
                    <p className="text-gray-500">이메일</p>
                    <p>{user.email}</p>
                  </div>
                </div>
                <hr />
                <div className="pt-3 flex items-start gap-3">
                  <MdCake className="w-6 h-6 text-indigo-500 mt-1" />
                  <div>
                    <p className="text-gray-500">생년월일</p>
                    <p>{residentNumber}</p>
                  </div>
                </div>
                <hr />
                <div className="pt-3 flex items-start gap-3">
                  <MdCalendarToday className="w-6 h-6 text-indigo-500 mt-1" />
                  <div>
                    <p className="text-gray-500">가입일</p>
                    <p>{user.createdAt.split('T')[0]}</p>
                  </div>
                </div>
                <hr />
                <div className="pt-3 flex items-start gap-3">
                  <FaTicketAlt className="w-6 h-6 text-indigo-500 mt-1" />
                  <div>
                    <p className="text-gray-500">총 예매횟수</p>
                    <p>{user.ticketCount}회</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽 예매 내역 */}
            <div className="max-w-[900px] w-full">
              <div className="p-8 bg-white rounded-xl shadow w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold">최근 예매/취소 내역</h3>
                  <div className="flex gap-3">
                    {(['전체', '예약완료', '취소'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFilter(f);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-full border text-base ${
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
                  className="flex items-start justify-between border border-gray-300 shadow-sm rounded-lg p-6 mb-6 text-base font-medium"
                >
                  {/* 좌측: 이미지 + 정보 */}
                  <div className="flex gap-6 w-full">
                    {/* 이미지 */}
                    <div className="w-[120px] aspect-[3/4] rounded overflow-hidden shrink-0 bg-gray-200">
                      <img
                        src={item.poster_url}
                        alt={`${item.title} 포스터`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 텍스트 + 버튼 같이 묶기 */}
                    <div className="flex flex-col justify-between w-full">
                      {/* 텍스트 묶음 */}
                      <div>
                        <p className="text-lg font-bold mb-1">{item.title}</p>
                        <p className="text-gray-600">{item.start_date} {item.start_time}</p>
                        <p className="text-gray-600">{item.location}</p>
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-white text-sm ${
                            item.status === '예약완료' ? 'bg-green-500' : 'bg-gray-400'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {item.ticketType} / {item.gradeName}
                          </span>
                        </div>
                      </div>

                      {/* 버튼 묶음 */}
                      <div className="mt-4 flex gap-2">
                        <button className="px-4 py-2 bg-gray-200 text-sm rounded">상세보기</button>
                        <button
                          onClick={() => {
                            if (item.status === '예약완료') {
                              setPendingCancelInfo({
                                seatId: item.seatId,
                                ticketId: item.id.toString(),
                                tokenId: item.tokenId,
                              });
                              setShowConfirmModal(true); // 이 줄이 꼭 필요함!
                            }
                          }}
                          
                          className={`px-4 py-2 text-sm rounded ${
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

                  {/* 우측: 가격/예매일 */}
                  <div className="text-right text-sm whitespace-nowrap pl-4 shrink-0">
                    <p className="font-semibold mb-1">{item.price}원</p>
                    <p className="text-gray-500">예매일: {item.bookedAt.split('T')[0]}</p>
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
