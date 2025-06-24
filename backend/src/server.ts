import dotenv from 'dotenv';
import app from './app';

// 환경 변수 로드
dotenv.config();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL}`);
}); 