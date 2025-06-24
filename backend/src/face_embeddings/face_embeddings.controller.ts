import { Router } from 'express';
import { getAllFaceEmbeddings, createFaceEmbedding } from './face_embeddings.service';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllFaceEmbeddings());
});

router.post('/', (req, res) => {
  const embedding = createFaceEmbedding(req.body);
  res.status(201).json(embedding);
});

export default router; 