import { Router } from 'express';
import { getAllUsers, createUser } from './users.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllUsers());
});

router.post('/', (req, res) => {
  const user = createUser(req.body);
  res.status(201).json(user);
});

export default router; 