export interface Concert {
  id: string;
  title: string;
  main_performer: string;
  start_date: string;
  start_time: string;
  poster_url: string;
  venue_id: string;
  running_time: string;
  promoter: string;
  customer_service: string;
  age_rating: string;
  booking_fee: number;
  valid_from: string;
  valid_to: string;
  ticket_open_at: string;
  venues: {
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