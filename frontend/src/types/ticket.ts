//블록체인 티켓 민팅 결과
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

// 전체 티켓 정보 
export interface TicketInfo {
  tokenId: string;
  ticketId: string;
  metadata: TicketMetadata;
  price: number;
}