'use client';

import React, { useState } from 'react';
import NFTTicket from '../../components/NFTTicket';

const NFTTicketDemo = () => {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const demoTickets = [
    {
      id: 'ticket-001',
      concertTitle: 'MEENOIE CONCERT',
      performer: 'MEENOIE',
      date: '2025-07-26',
      time: '오후 07시 30분',
      venue: '올림픽공원 KSPO DOME',
      seatInfo: 'VIP석 02구역 A열 12번',
      price: 154000,
      tokenId: '1234-567-890',
      isSpecialEdition: true,
      year: '2025 SUMMER',
      genre: 'CONCERT'
    },
    {
      id: 'ticket-002',
      concertTitle: 'BTS WORLD TOUR',
      performer: 'BTS',
      date: '2025-08-15',
      time: '오후 08시 00분',
      venue: '서울월드컵경기장',
      seatInfo: 'R석 15구역 C열 08번',
      price: 132000,
      tokenId: '2345-678-901',
      isSpecialEdition: false,
      year: '2025',
      genre: 'WORLD TOUR'
    },
    {
      id: 'ticket-003',
      concertTitle: 'BLACKPINK ENCORE',
      performer: 'BLACKPINK',
      date: '2025-09-20',
      time: '오후 07시 00분',
      venue: '고척스카이돔',
      seatInfo: 'VIP석 01구역 B열 15번',
      price: 165000,
      tokenId: '3456-789-012',
      isSpecialEdition: true,
      year: '2025 SPECIAL',
      genre: 'ENCORE'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            NFT 티켓 디자인 데모
          </h1>
          <p className="text-gray-300 text-lg">
            Tickity의 NFT 티켓 디자인을 미리 확인해보세요
          </p>
        </div>

        {/* 티켓 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {demoTickets.map((ticket) => (
            <div key={ticket.id} className="transform hover:scale-105 transition-transform duration-300">
              <NFTTicket
                ticket={ticket}
                onViewDetails={() => setSelectedTicket(ticket.id)}
                showCloseButton={false}
              />
            </div>
          ))}
        </div>

        {/* 특징 설명 */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">🎨</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">모던한 디자인</h3>
            <p className="text-gray-300 text-sm">
              어두운 테마와 그라디언트 효과로 프리미엄한 느낌을 연출합니다.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">🔒</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">QR 코드 인증</h3>
            <p className="text-gray-300 text-sm">
              고유한 QR 코드로 티켓의 진위성을 확인할 수 있습니다.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">⚡</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">NFT 기반</h3>
            <p className="text-gray-300 text-sm">
              블록체인 기술로 위변조가 불가능한 디지털 티켓입니다.
            </p>
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            컴포넌트 사용법
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`import NFTTicket from './components/NFTTicket';

const ticket = {
  id: 'ticket-001',
  concertTitle: 'MEENOIE CONCERT',
  performer: 'Yet To Come in Seoul',
  date: '2025-07-26',
  time: '오후 07시 30분',
  venue: '올림픽공원 KSPO DOME',
  seatInfo: 'VIP석 02구역 A열 12번',
  price: 154000,
  tokenId: '1234-567-890',
  isSpecialEdition: true,
  year: '2025 SUMMER',
  genre: 'CONCERT'
};

<NFTTicket 
  ticket={ticket}
  onViewDetails={() => console.log('자세히 보기')}
  onClose={() => console.log('닫기')}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* 모달 (선택된 티켓이 있을 때) */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative">
            <NFTTicket
              ticket={demoTickets.find(t => t.id === selectedTicket)!}
              onClose={() => setSelectedTicket(null)}
              onViewDetails={() => {
                alert('실제 앱에서는 티켓 상세 페이지로 이동합니다.');
                setSelectedTicket(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTTicketDemo; 