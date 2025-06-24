$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

Write-Host "📦 Tickity 프로젝트 초기 설정 시작..."

# 1. 프론트엔드 설정
Write-Host "🔧 [1/3] 프론트엔드 설치 중..."
cd frontend
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 프론트엔드 npm install 실패"; $global:LASTEXITCODE = 1; return }
cd ..

# 2. 블록체인 설정
Write-Host "🔧 [2/3] 블록체인 설치 중..."
cd blockchain
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 블록체인 npm install 실패"; $global:LASTEXITCODE = 1; return }
cd ..

# 3. AI 서버 설정
Write-Host "🔧 [3/3] AI 서버 설정 중..."
cd ai-server

# Python 3.12.8 환경 준비 (윈도우는 apt 명령어 없음 → 설치는 수동으로 설치해야 함, 여기선 스킵)

# 가상환경 생성 및 활성화
python -m venv venv
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 가상환경 생성 실패"; $global:LASTEXITCODE = 1; return }

# 윈도우에서는 .\venv\Scripts\Activate.ps1 사용
.\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "❌ 가상환경 활성화 실패"; $global:LASTEXITCODE = 1; return }

# pip 설치 및 requirements 설치
pip install --upgrade pip
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { Write-Host "❌ requirements.txt 설치 실패"; $global:LASTEXITCODE = 1; return }

cd ..

Write-Host "✅ 초기 설정 완료!"
Write-Host "-----------------------------"
Write-Host "🔹 프론트엔드 실행: cd frontend && npm run dev"
Write-Host "🔹 블록체인 노드 실행: cd blockchain && npx hardhat node"
Write-Host "🔹 스마트컨트랙트 배포: npx hardhat run scripts/deploy.ts --network localhost"
Write-Host "🔹 AI 서버 실행: cd ai-server && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload"
