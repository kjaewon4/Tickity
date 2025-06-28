#!/bin/bash

echo "🔧 [1/5] AI 서버 디렉토리 이동"
cd ai-server || { echo "❌ ai-server 디렉토리가 없습니다."; exit 1; }

echo "🔧 [2/5] 가상환경 venv310 생성"
python3 -m venv venv310

echo "🔧 [3/5] 가상환경 활성화"
source venv310/bin/activate

echo "🔧 [4/5] requirements.txt 설치"
pip install --upgrade pip
pip install -r requirements.txt

echo "🔧 [5/5] .env 파일 생성"
cat << EOF > .env
# Supabase Configuration
SUPABASE_URL=https://tzlluqiqfopgaaugshgj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bGx1cWlxZm9wZ2FhdWdzaGdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc1MzUxMiwiZXhwIjoyMDY2MzI5NTEyfQ.FjziJWAAPNXhqm4aBO35eWEfwAuilS1zUXQJh9HtQYo

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Server Configuration
PORT=4000
NODE_ENV=development 
EOF

echo "✅ 설정 완료. FastAPI 서버 실행은 다음 명령어로 진행하세요:"
echo "uvicorn main:app --reload"