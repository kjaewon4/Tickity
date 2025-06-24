import express from 'express';
import cors from 'cors';
import usersRouter from './users/users.controller';
import concertsRouter from './concerts/concerts.controller';
import faceEmbeddingsRouter from './face_embeddings/face_embeddings.controller';
import seatGradesRouter from './seat_grades/seat_grades.controller';
import seatsRouter from './seats/seats.controller';
import ticketsRouter from './tickets/tickets.controller';
import authRouter from './auth/auth.controller';

const app = express();

// CORS 설정 - 특정 ngrok URL들 허용
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://myserver.ngrok.pro',  // 프론트엔드 ngrok URL
  'https://myserver2.ngrok.pro', // 백엔드 ngrok URL
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우 (같은 도메인 요청) 허용
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 라우터
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/concerts', concertsRouter);
app.use('/face-embeddings', faceEmbeddingsRouter);
app.use('/seat-grades', seatGradesRouter);
app.use('/seats', seatsRouter);
app.use('/tickets', ticketsRouter);

export default app; 