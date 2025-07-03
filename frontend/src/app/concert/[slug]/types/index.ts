export interface Concert {
  id: string;
  title: string;
  start_date: string;
  start_time: string;
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
  valid_from: string;
  valid_to: string;
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
  ticket_open_at?: string;
  venues?: {
    id: string;
    name: string;
    address: string;
    capacity: number;
  };
}

export interface SeatPrice {
  seat_grade_id: string;
  grade_name: string;
  price: number;
  total_seats: number;
}

export interface CancellationPolicy {
  id: string;
  period_desc: string;
  fee_desc: string;
}

export interface TicketInfo {
  image: string;
  title: string;
  subtitle: string;
  location: string;
  address: string;
  dateRange: string;
  runtime: string;
  price: string;
  promoter: string;
  ageLimit: string;
  contact: string;
  serviceFee: string;
} 