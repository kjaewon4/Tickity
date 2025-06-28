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

echo "🔧 [5/5] .env 파일 복사"
cp ../ai-server/.env .env

echo "✅ 설정 완료!"
echo "FastAPI 서버 실행은 다음 명령어로 진행하세요:"
echo "uvicorn main:app --reload" 