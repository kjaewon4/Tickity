import { Seat } from './seats.model';

const seats: Seat[] = [];

export const getAllSeats = (): Seat[] => seats;

export const createSeat = (seat: Seat): Seat => {
  seats.push(seat);
  return seat;
}; 