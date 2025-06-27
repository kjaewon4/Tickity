import { Router } from 'express';
import { getAllSeatGrades, createSeatGrade } from './seat_grades.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllSeatGrades());
});

router.post('/', (req, res) => {
  const grade = createSeatGrade(req.body);
  res.status(201).json(grade);
});

export default router; 