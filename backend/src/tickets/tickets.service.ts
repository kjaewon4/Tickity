import { Ticket } from './tickets.model';

const tickets: Ticket[] = [];

export const getAllTickets = (): Ticket[] => tickets;

export const createTicket = (ticket: Ticket): Ticket => {
  tickets.push(ticket);
  return ticket;
}; 