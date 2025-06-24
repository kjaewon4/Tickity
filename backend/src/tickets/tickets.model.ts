export interface Ticket {
  id: string;
  user_id: string;
  concert_id: string;
  seat_id: string;
  nft_token_id: string;
  token_uri: string;
  tx_hash: string;
  issued_at: string;
  purchase_price: number;
  is_used: boolean;
  canceled_at: string;
  cancellation_fee: number;
  refund_tx_hash: string;
  created_at: string;
} 