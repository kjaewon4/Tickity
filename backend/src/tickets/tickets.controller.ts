import { Router } from 'express';
import { getAllTickets, createTicket } from './tickets.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllTickets());
});

router.post('/', (req, res) => {
  const ticket = createTicket(req.body);
  res.status(201).json(ticket);
});

export default router; 