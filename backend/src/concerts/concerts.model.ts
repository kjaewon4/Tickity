export interface Concert {
  id: string;
  title: string;
  start_date: string; // 공연 시작 날짜 (YYYY-MM-DD 형태)
  start_time: string; // 공연 시작 시간 (HH:mm 형태)
  venue_id: string;
  poster_url?: string;
  created_at: string;
  organizer: string;
  promoter: string;
  customer_service: string;
  running_time: string;
  age_rating: string;
  main_performer: string;
  booking_fee: number;
  shipping_note: string;
  valid_from: string; // 예매 시작일 (ISO 8601 date 형태: YYYY-MM-DD)
  valid_to: string; // 예매 종료일 (ISO 8601 date 형태: YYYY-MM-DD)
  mobile_ticket_supported: boolean;
  android_min_version: string;
  ios_min_version: string;
  id_doc_required: boolean;
  seller_name: string;
  seller_rep: string;
  seller_reg_no: string;
  seller_email: string;
  seller_contact: string;
  seller_address: string;
  category: string;
  round?: number;
  ticket_open_at?: string; // 티켓 오픈 시간 (ISO 8601 형태: YYYY-MM-DDTHH:mm:ss.sssZ)
} 