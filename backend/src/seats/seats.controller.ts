import { Router } from 'express';
import { getAllSeats, createSeat } from './seats.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllSeats());
});

router.post('/', (req, res) => {
  const seat = createSeat(req.body);
  res.status(201).json(seat);
});

export default router; 