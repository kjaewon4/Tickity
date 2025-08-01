import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config();
import "./schedulers/reopen.scheduler";    // ← import 만 해도 스케줄러가 자동 등록됩니다
import { startReopenScheduler } from "./schedulers/reopen.scheduler";
import { scheduleReleaseExpiredSeats } from './schedulers/releaseExpiredSeats';

import cors from 'cors';
import usersRouter from './users/users.controller';
import concertsRouter from './concerts/concerts.controller';
import venuesRouter from './venues/venues.controller';
import seatGradesRouter from './seat_grades/seat_grades.controller';
import ticketsRouter from './tickets/tickets.controller';
import authRouter from './auth/auth.controller';
import chatbotRouter from './chatbot/chatbot.controller';
import uploadsRouter from './uploads/uploads.controller';
import cancellationPoliciesRouter from './cancellation_policies/cancellation_policies.controller';
import morgan from 'morgan';

scheduleReleaseExpiredSeats(); // 1분마다 자동으로 만료된 좌석을 AVAILABLE로 복구
startReopenScheduler()

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
app.use(morgan('dev'));

// Auth (로그인/회원가입 등)
app.use('/auth', authRouter);
// 사용자, 공연, 좌석등급 기본 CRUD
app.use('/users', usersRouter);
app.use('/concerts', concertsRouter);
app.use('/venues', venuesRouter);
app.use('/seat-grades', seatGradesRouter);

// ■ 티켓 관련 라우트
//    - GET/POST 티켓 조회·발급
//    - /tickets/cancel (티켓 취소 / on-chain + DB)
//    - /tickets/... 기타 엔드포인트
app.use('/tickets', ticketsRouter);

app.use('/chatbot', chatbotRouter);
app.use('/uploads', uploadsRouter);
app.use('/cancellation-policies', cancellationPoliciesRouter);

export default app; 