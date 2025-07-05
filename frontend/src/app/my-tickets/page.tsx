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
  nft_token_id: string | null;
  purchase_price: number;
  user_id: string;
}

interface TicketInfo {
  tokenId: string;
  metadata: TicketMetadata;
  price: number;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

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
        if (!ticketsResponse?.tickets || ticketsResponse.tickets.length === 0) {
          setTickets([]);
          return;
        }

        // 3. NFT 토큰 ID가 있고 유효한 티켓만 필터링 (토큰 ID 0 제외)
        const mintedTickets = ticketsResponse.tickets.filter(ticket => 
          ticket.nft_token_id !== null && 
          ticket.nft_token_id !== undefined &&
          ticket.nft_token_id !== '0' &&
          Number(ticket.nft_token_id) > 0
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
      <h1 className="text-3xl font-bold mb-8">NFT 티켓 테스트 페이지</h1>
      <p className="text-gray-600 mb-4">사용자 ID: {userId}</p>
      {tickets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">민팅된 NFT 티켓이 없습니다.</p>
          <p className="text-gray-400 mt-2">티켓을 구매하고 민팅 과정을 완료해주세요.</p>
        </div>
      ) : (
        <div className="space-y-8">
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
                    id: getAttributeValue(ticket.metadata.attributes, 'Holder'),
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
      )}
    </div>
  );
} 