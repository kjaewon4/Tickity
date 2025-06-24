#!/bin/bash

echo "📦 Tickity 프로젝트 초기 설정 시작..."

# DNS 문제 해결
echo "🌐 DNS 설정 중 (8.8.8.8 적용)..."
sudo bash -c 'echo -e "nameserver 8.8.8.8\nnameserver 1.1.1.1" > /etc/resolv.conf'

# Python 3.12 설치 및 기본 설정
echo "🐍 Python 3.12 설치 및 등록 중..."
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev python3-pip

# python3 기본값을 3.12로 설정
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 2
sudo update-alternatives --set python3 /usr/bin/python3.12

# pip도 최신화
echo "⬆️ pip 업그레이드 중..."
python3 -m ensurepip --upgrade
python3 -m pip install --upgrade pip

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
python3 -m venv venv || { echo "❌ 가상환경 생성 실패"; exit 1; }
source venv/bin/activate || { echo "❌ 가상환경 활성화 실패"; exit 1; }

# requirements 설치 (버전 존재 확인도 필요)
echo "📦 requirements.txt 설치 중..."
if grep -q "anyio==4.9.0" requirements.txt; then
  echo "⚠️ anyio==4.9.0은 존재하지 않으므로 4.6.2로 자동 교체"
  sed -i 's/anyio==4.9.0/anyio==4.6.2/' requirements.txt
fi

pip install --upgrade pip
pip install -r requirements.txt || { echo "❌ requirements.txt 설치 실패"; exit 1; }
cd ..

echo "✅ 초기 설정 완료!"
echo "-----------------------------"
echo "🔹 프론트엔드 실행: cd frontend && npm run dev"
echo "🔹 블록체인 노드 실행: cd blockchain && npx hardhat node"
echo "🔹 스마트컨트랙트 배포: npx hardhat run scripts/deploy.ts --network localhost"
echo "🔹 AI 서버 실행: cd ai-server && source venv/bin/activate && uvicorn app.main:app --reload"

