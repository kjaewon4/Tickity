import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import "./schedulers/reopen.scheduler";    // ← import 만 해도 스케줄러가 자동 등록됩니다
import { startReopenScheduler } from "./schedulers/reopen.scheduler";
import cors from 'cors';
import usersRouter from './users/users.controller';
import concertsRouter from './concerts/concerts.controller';
import venuesRouter from './venues/venues.controller';
import faceEmbeddingsRouter from './face_embeddings/face_embeddings.controller';
import seatGradesRouter from './seat_grades/seat_grades.controller';
import seatsRouter from './seats/seats.controller';
import ticketsRouter from './tickets/tickets.controller';
import authRouter from './auth/auth.controller';
import chatbotRouter from './chatbot/chatbot.controller';
import userFavoritesRouter from './user_favorites/user_favorites.controller';


// NODE_ENV가 test 가 아닐 때만 스케줄러 구동
if (process.env.NODE_ENV !== 'test') {
  startReopenScheduler()
}

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
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS from ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.json());

// Auth (로그인/회원가입 등)
app.use('/auth', authRouter);
// 사용자, 공연, 얼굴임베딩, 좌석등급, 좌석 기본 CRUD
app.use('/users', usersRouter);
app.use('/concerts', concertsRouter);
app.use('/venues', venuesRouter);
app.use('/face-embeddings', faceEmbeddingsRouter);
app.use('/seat-grades', seatGradesRouter);
app.use('/seats', seatsRouter);

// ■ 티켓 관련 라우트
//    - GET/POST 티켓 조회·발급
//    - /tickets/cancel (티켓 취소 / on-chain + DB)
//    - /tickets/... 기타 엔드포인트
app.use('/tickets', ticketsRouter);

// ■ 찜하기 관련 라우트
//    - POST /user-favorites (찜하기 추가)
//    - DELETE /user-favorites/:concertId (찜하기 삭제)
//    - GET /user-favorites (내가 찜한 공연 목록)
//    - GET /user-favorites/check/:concertId (찜하기 상태 확인)
//    - POST /user-favorites/toggle/:concertId (찜하기 토글)
app.use('/user-favorites', userFavoritesRouter);

app.use('/chatbot', chatbotRouter);

export default app; 