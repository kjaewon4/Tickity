#!/bin/bash

echo "===== Tickity 전체 개발 환경 자동 세팅 ====="

# 1. 프론트엔드
echo "[1/4] frontend 의존성 설치"
cd frontend
npm install
cd ..

# 2. 백엔드
echo "[2/4] backend 의존성 설치"
cd backend
npm install
cd ..

# 3. 블록체인
echo "[3/4] blockchain 의존성 설치"
cd blockchain
npm install
cd ..

# 4. AI 서버 (Python)
echo "[4/4] ai-server 의존성 설치"
cd ai-server
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

echo "모든 의존성 설치 완료!"
echo "-----------------------------"
echo "각 서비스 개발 서버 실행 명령:"
echo "  프론트엔드: cd frontend && npm run dev"
echo "  백엔드:    cd backend && npm run dev"
echo "  블록체인:  cd blockchain && npx hardhat node"
echo "  AI 서버:   cd ai-server && source venv/bin/activate && uvicorn app.main:app --reload" 