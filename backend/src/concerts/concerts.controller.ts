import { Router } from 'express';
import { getAllConcerts, createConcert } from './concerts.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllConcerts());
});

router.post('/', (req, res) => {
  const concert = createConcert(req.body);
  res.status(201).json(concert);
});

export default router; 