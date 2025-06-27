import dotenv from 'dotenv';
import app from './app';
import { config } from './config/environment';

// 환경 변수 로드
dotenv.config();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`Backend URL: ${config.BACKEND_URL}`);
  console.log(`Environment: ${config.NODE_ENV}`);
}); 