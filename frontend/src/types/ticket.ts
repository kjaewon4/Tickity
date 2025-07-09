// 블록체인 티켓 민팅 결과 (이것은 블록체인 응답에만 사용)
export interface TicketMintResult {
  token_id: string;
  tx_hash: string;
  metadata_uri: string;
  seat_number: string;
}

// NFT 메타데이터 구조 정의
export interface TicketMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

// 전체 티켓 정보 (API로부터 받는 원본 티켓 정보)
export interface UserTicket {
  id: string;
  concert: {
    id: string;
    title: string;
    start_date: string;
  };
  seat: {
    section: string;
    row: string;
    number: string;
  };
  price: number;
  is_cancelled?: boolean;
  status: 'active' | 'canceled';
}

// Navbar와 RecentNFTTickets에서 사용할 "표시용" 티켓 정보 타입

export interface TicketInfo {
  tokenId: string; 
  ticketId: string; 
  metadata: TicketMetadata; 
  price: number; 
  concert: { 
    id: string;
    title: string;
    start_date: string;
  };
}