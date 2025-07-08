'use client';

import { useEffect, useState } from 'react';
import NFTTicket from '@/components/NFTTicket';
import { apiClient } from '@/lib/apiClient';
import { UserResponse, ApiResponse } from '@/types/auth';

interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface UserTicket {
  id: string;
  nft_token_id: string | null;
  purchase_price: number;
  user_id: string;
  seat_number: string;
  tx_hash?: string;
  created_at: string;
  concert?: {
    title: string;
    start_date: string;
    start_time: string;
    venue_name: string;
  };
}

interface TicketInfo {
  tokenId: string;
  ticketId: string;
  metadata: TicketMetadata;
  price: number;
}

interface DebugTicketInfo {
  ticket: UserTicket;
  status: 'minted' | 'unminted' | 'error';
  metadata?: TicketMetadata;
  errorMessage?: string;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [debugTickets, setDebugTickets] = useState<DebugTicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      try {
        // 1. 사용자 정보 가져오기
        const { data: userResponse } = await apiClient.getUser();
        if (!userResponse?.user?.id) {
          setError('사용자 정보를 찾을 수 없습니다.');
          return;
        }
        setUserId(userResponse.user.id);

        // 2. 사용자의 티켓 목록 조회 (올바른 엔드포인트 사용)
        const { data: ticketsResponse } = await apiClient.get<{ tickets: UserTicket[]; total: number }>(`/tickets/my-tickets/${userResponse.user.id}`);
        
        console.log('🔍 전체 티켓 목록:', ticketsResponse);
        
        if (!ticketsResponse?.tickets || ticketsResponse.tickets.length === 0) {
          setTickets([]);
          setDebugTickets([]);
          return;
        }

        // 🔍 디버깅: 모든 티켓 상태 분석
        const allTicketsDebug: DebugTicketInfo[] = [];
        for (const ticket of ticketsResponse.tickets) {
          console.log(`🎫 티켓 분석: ${ticket.id}`, {
            nft_token_id: ticket.nft_token_id,
            tx_hash: ticket.tx_hash,
            concert: ticket.concert?.title,
            seat_number: ticket.seat_number,
            price: ticket.purchase_price
          });

          if (!ticket.nft_token_id || ticket.nft_token_id === '0' || Number(ticket.nft_token_id) <= 0) {
            allTicketsDebug.push({
              ticket,
              status: 'unminted',
              errorMessage: `NFT 민팅 안됨 (token_id: ${ticket.nft_token_id})`
            });
          } else {
            try {
              const { data: metadata } = await apiClient.get<TicketMetadata>(`/tickets/metadata/${ticket.nft_token_id}`);
              allTicketsDebug.push({
                ticket,
                status: 'minted',
                metadata
              });
            } catch (err: any) {
              console.error(`토큰 ${ticket.nft_token_id} 메타데이터 오류:`, err);
              allTicketsDebug.push({
                ticket,
                status: 'error',
                errorMessage: err.response?.data?.error || err.message || '메타데이터 조회 실패'
              });
            }
          }
        }

        setDebugTickets(allTicketsDebug);

        // 3. 기존 로직: NFT 토큰 ID가 있고 유효한 티켓만 필터링
        const mintedTickets = ticketsResponse.tickets.filter(ticket => 
          ticket.nft_token_id !== null && 
          ticket.nft_token_id !== undefined &&
          ticket.nft_token_id !== '0' &&
          BigInt(ticket.nft_token_id) > BigInt(0)
        );

        if (mintedTickets.length === 0) {
          console.log('민팅된 NFT 티켓이 없습니다.');
          setTickets([]);
          return;
        }

        // 4. 각 티켓의 메타데이터 조회
        const ticketPromises = mintedTickets.map(async (ticket: UserTicket) => {
          try {
            const { data: metadata } = await apiClient.get<TicketMetadata>(`/tickets/metadata/${ticket.nft_token_id}`);
            
            // 메타데이터 유효성 검사
            if (!metadata || !metadata.attributes || !Array.isArray(metadata.attributes)) {
              console.error(`토큰 ${ticket.nft_token_id}의 메타데이터가 유효하지 않습니다:`, metadata);
              return null;
            }

            return {
              tokenId: ticket.nft_token_id!,
              ticketId: ticket.id,
              metadata,
              price: ticket.purchase_price
            };
          } catch (err: any) {
            console.error(`토큰 ${ticket.nft_token_id} 처리 중 오류:`, err);
            
            // 블록체인 검증 실패 시 더 상세한 로그
            if (err.response?.data?.error?.includes('블록체인에 발행되지 않았습니다')) {
              console.warn(`토큰 ${ticket.nft_token_id}는 DB에 있지만 블록체인에 민팅되지 않았습니다.`);
            } else if (err.response?.data?.error?.includes('존재하지 않는 티켓')) {
              console.warn(`토큰 ${ticket.nft_token_id}는 블록체인에서 찾을 수 없습니다.`);
            }
            
            return null;
          }
        });

        const results = await Promise.all(ticketPromises);
        const validTickets = results.filter((ticket): ticket is TicketInfo => ticket !== null);
        setTickets(validTickets);
      } catch (err) {
        console.error('티켓 조회 실패:', err);
        setError(err instanceof Error ? err.message : '티켓 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  const getAttributeValue = (attributes: TicketMetadata['attributes'], traitType: string) => {
    if (!attributes || !Array.isArray(attributes)) {
      console.warn('attributes가 유효하지 않습니다:', attributes);
      return '';
    }
    return attributes.find(attr => attr.trait_type === traitType)?.value || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">오류 발생!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NFT 티켓 상태 확인</h1>
      <p className="text-gray-600 mb-4">사용자 ID: {userId}</p>
      
      {/* 🔍 디버깅 모드 토글 */}
      <div className="mb-6">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {debugMode ? '정상 모드로 전환' : '🔍 디버깅 모드 (모든 티켓 보기)'}
        </button>
      </div>

      {debugMode && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-yellow-800">🔍 전체 티켓 상태 (디버깅)</h2>
          {debugTickets.length === 0 ? (
            <p className="text-yellow-700">구매한 티켓이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {debugTickets.map((item, index) => (
                <div key={index} className="bg-white p-4 border rounded shadow">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-bold text-gray-800">티켓 정보</h3>
                      <p><strong>ID:</strong> {item.ticket.id}</p>
                      <p><strong>콘서트:</strong> {item.ticket.concert?.title || '정보 없음'}</p>
                      <p><strong>좌석:</strong> {item.ticket.seat_number}</p>
                      <p><strong>가격:</strong> {item.ticket.purchase_price.toLocaleString()}원</p>
                      <p><strong>구매일:</strong> {new Date(item.ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">NFT 상태</h3>
                      <p><strong>토큰 ID:</strong> {item.ticket.nft_token_id || 'null'}</p>
                      <p><strong>트랜잭션:</strong> {item.ticket.tx_hash || 'null'}</p>
                      <div className={`inline-block px-3 py-1 rounded text-sm font-bold ${
                        item.status === 'minted' ? 'bg-green-100 text-green-800' :
                        item.status === 'unminted' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status === 'minted' ? '✅ 민팅 완료' : 
                         item.status === 'unminted' ? '❌ 민팅 안됨' : 
                         '⚠️ 오류'}
                      </div>
                      {item.errorMessage && (
                        <p className="text-red-600 text-sm mt-1">{item.errorMessage}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 기존 NFT 티켓 표시 */}
      {tickets.length === 0 && !debugMode ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg mb-2">민팅된 NFT 티켓이 없습니다.</p>
          <p className="text-gray-400">위의 "🔍 디버깅 모드" 버튼을 눌러 전체 티켓 상태를 확인해보세요.</p>
        </div>
      ) : !debugMode ? (
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-green-600">✅ 정상 민팅된 NFT 티켓들</h2>
          {tickets.map((ticket) => (
            <div key={ticket.tokenId} className="p-4 border rounded-lg">
              <div className="mb-4">
                <h2 className="text-xl font-bold">티켓 정보</h2>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(ticket.metadata, null, 2)}
                </pre>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-4">NFT 티켓 렌더링 결과:</h3>
                <NFTTicket
                  ticket={{
                    id: ticket.ticketId,
                    concertTitle: getAttributeValue(ticket.metadata.attributes, 'Concert'),
                    date: getAttributeValue(ticket.metadata.attributes, 'Date'),
                    time: getAttributeValue(ticket.metadata.attributes, 'Time'),
                    venue: getAttributeValue(ticket.metadata.attributes, 'Venue'),
                    seatInfo: getAttributeValue(ticket.metadata.attributes, 'Seat'),
                    price: ticket.price,
                    tokenId: ticket.tokenId,
                    Holder: getAttributeValue(ticket.metadata.attributes, 'Holder')
                  }}
                  showCloseButton={false}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
} 