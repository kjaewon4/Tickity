#!/bin/bash

echo "📦 Tickity 프로젝트 초기 설정 시작..."

# 1. 프론트엔드 설정
echo "🔧 [1/3] 프론트엔드 설치 중..."
cd frontend
npm install || { echo "❌ 프론트엔드 npm install 실패"; exit 1; }
cd ..

# 2. 블록체인 설정
echo "🔧 [2/3] 블록체인 설치 중..."
cd blockchain
npm install || { echo "❌ 블록체인 npm install 실패"; exit 1; }
cd ..

# 3. AI 서버 설정
echo "🔧 [3/3] AI 서버 설정 중..."
cd ai-server

# Python 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 시스템 종속성 확인 및 설치
sudo apt update
sudo apt install -y python3.10-venv python3.10-distutils

# Python 패키지 설치
pip install --upgrade pip
pip install -r requirements.txt || { echo "❌ requirements.txt 설치 실패"; exit 1; }

cd ..

echo "✅ 초기 설정 완료!"
echo "-----------------------------"
echo "🔹 프론트엔드 실행: cd frontend && npm run dev"
echo "🔹 블록체인 노드 실행: cd blockchain && npx hardhat node"
echo "🔹 스마트컨트랙트 배포: npx hardhat run scripts/deploy.ts --network localhost"
echo "🔹 AI 서버 실행: cd ai-server && source venv/bin/activate && uvicorn app.main:app --reload"

