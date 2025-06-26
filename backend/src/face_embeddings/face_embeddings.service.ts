import { FaceEmbedding } from './face_embeddings.model';

const faceEmbeddings: FaceEmbedding[] = [];

export const getAllFaceEmbeddings = (): FaceEmbedding[] => faceEmbeddings;

export const createFaceEmbedding = (embedding: FaceEmbedding): FaceEmbedding => {
  faceEmbeddings.push(embedding);
  return embedding;
}; 