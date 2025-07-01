# Tickity - NFT 기반 티켓 암표 방지 서비스

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

> 티켓 암표 거래를 근본적으로 차단하는 NFT 기반 티켓팅 플랫폼

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [설치 및 실행](#설치-및-실행)
- [API 문서](#api-문서)
- [팀원 소개](#팀원-소개)
- [기여 가이드](#기여-가이드)
- [라이선스](#라이선스)

## 프로젝트 개요

### 배경 및 문제점

현재 콘서트 티켓 시장에서 발생하는 암표 거래 문제는 실제 팬들이 정당한 가격으로 티켓을 구매하지 못하게 하며, 불법적인 경로를 통해 고가에 재판매되는 상황을 초래하고 있습니다.

**주요 문제점:**
- **암표 거래**: 개인 간 비공식 거래로 인한 사기, 신뢰 문제
- **대리입장**: 신분증과 티켓을 빌려주는 방식의 개인정보 도용
- **위조 티켓**: 공연장 입장 시 본인 확인 절차에서의 혼란

### 해결책

Tickity는 NFT 기반 티켓팅 플랫폼으로 다음과 같은 혁신적인 솔루션을 제공합니다:

- **NFT 기반 티켓**: 위변조가 불가능한 블록체인 기반 티켓
- **AI 신원 인증**: 대리입장 방지를 위한 얼굴 인식 시스템
- **AI 챗봇**: 24시간 자동화된 고객 응대
- **투명한 거래**: 블록체인을 통한 모든 거래 기록 공개

## 주요 기능

### 티켓팅 시스템
- 실시간 좌석 선택 및 예매
- 투명한 거래와 공정한 배분
- 모바일 티켓 지원

### AI 기반 신원 인증
- 블록체인 연동 얼굴 인식 시스템
- 대리입장 및 도용 방지
- 실시간 본인 확인

### NFT 기반 티켓 관리
- 위변조 불가능한 NFT 티켓 발행
- 투명한 소유권 이전
- 자동화된 입장 검증

### AI 챗봇 고객 응대
- 24시간 자동화된 상담
- 티켓 환불 및 취소 처리
- 공연 정보 및 FAQ 응답

## 기술 스택

### Frontend
- **TypeScript** - 타입 안정성을 위한 정적 타입 언어
- **React** - 사용자 인터페이스 구축을 위한 라이브러리
- **Next.js** - React 기반 풀스택 프레임워크
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크

### Backend
- **Node.js** - 서버 사이드 JavaScript 런타임
- **Express.js** - 웹 애플리케이션 프레임워크
- **TypeScript** - 백엔드 타입 안정성

### Database & Cloud
- **Supabase** - PostgreSQL 기반 백엔드 서비스
- **PostgreSQL** - 관계형 데이터베이스

### Blockchain
- **Solidity** - 스마트 컨트랙트 개발 언어
- **Hardhat** - Ethereum 개발 환경
- **Ethers.js** - Ethereum 클라이언트 라이브러리

### AI & ML
- **Python** - 머신러닝 및 AI 개발 언어
- **InsightFace** - 얼굴 인식 및 분석 라이브러리
- **FastAPI** - 고성능 Python 웹 프레임워크

### DevOps & Tools
- **Git** - 버전 관리 시스템
- **Notion** - 프로젝트 문서화 및 협업 도구

## 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Server     │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Blockchain    │    │   Face Embed.   │
│   (Database)    │    │   (NFT)         │    │   (AI Model)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 설치 및 실행

### 사전 요구사항

- Node.js 18.0.0 이상
- Python 3.12 이상
- Git

### 1. 저장소 클론

```bash
git clone https://github.com/Blue-B/Tickity.git
cd Tickity
```

### 2. 환경 변수 설정

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Backend (.env)**
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Server Configuration
PORT=4000
NODE_ENV=development

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Ethereum RPC URL
RPC_URL=http://127.0.0.1:8545

# Admin Configuration
TEST_ADMIN_USER_ID=your_admin_user_id
ENCRYPTION_KEY=your_encryption_key
ADMIN_PRIVATE_KEY=your_admin_private_key
ADMIN_ADDRESS=your_admin_address

# Email Validation API Keys
MAILBOXLAYER_API_KEY1=your_mailboxlayer_api_key1
MAILBOXLAYER_API_KEY2=your_mailboxlayer_api_key2
MAILBOXLAYER_API_KEY3=your_mailboxlayer_api_key3
```

**AI Server (.env)**
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 3. 블록체인 설정 및 배포

```bash
cd blockchain

# 의존성 설치
npm install

# 컴파일
npx hardhat clean
npx hardhat compile

# 로컬 하드햇 네트워크에 컨트랙트 배포
npx hardhat run --network hardhat scripts/deploy.ts

# 하드햇 노드 실행 (새 터미널에서)
npx hardhat node
```

### 4. 백엔드 서버 실행

```bash
cd backend
npm install
npm run dev
```

### 5. 프론트엔드 서버 실행

```bash
cd frontend
npm install
npm run dev
```

### 6. AI 서버 실행 (선택사항)

```bash
cd ai-server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 전체 실행 프로세스 (한 번에 실행)

```bash
# 1. 블록체인 설정
cd blockchain
npm install
npx hardhat clean
npx hardhat compile
npx hardhat run --network hardhat scripts/deploy.ts

# 2. 하드햇 노드 실행 (새 터미널)
npx hardhat node

# 3. 백엔드 서버 실행 (새 터미널)
cd backend
npm install
npm run dev

# 4. 프론트엔드 서버 실행 (새 터미널)
cd frontend
npm install
npm run dev
```

### 서버 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드**: http://localhost:4000
- **하드햇 노드**: http://localhost:8545
- **AI 서버**: http://localhost:8000 (선택사항)

## API 문서

### 주요 엔드포인트

#### 콘서트 관련
```
GET    /concerts              # 전체 콘서트 목록
GET    /concerts?category=여자아이돌  # 카테고리별 콘서트
GET    /concerts/search       # 콘서트 검색
GET    /concerts/upcoming     # 다가오는 콘서트
GET    /concerts/:id          # 콘서트 상세 정보
```

#### 사용자 관련
```
GET    /users/profile/:id     # 사용자 프로필
PUT    /users/profile/:id     # 프로필 수정
GET    /users/dashboard/:id   # 마이페이지 대시보드
```

#### 인증 관련
```
POST   /auth/signup          # 회원가입
POST   /auth/login           # 로그인
GET    /auth/user            # 사용자 정보 조회
```

#### 티켓 관련
```
GET    /tickets/user/:id     # 사용자 티켓 목록
POST   /tickets/purchase     # 티켓 구매
PUT    /tickets/transfer     # 티켓 양도
```

## 팀원 소개

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/CHOICHANHEE03">
        <img src="https://avatars.githubusercontent.com/CHOICHANHEE03" width="100px;" alt=""/>
        <br />
        <sub><b>👑 CHOICHANHEE03</b></sub>
      </a>
      <br />
      <sub>LEADER / FRONTEND DEVELOPER</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Blue-B">
        <img src="https://avatars.githubusercontent.com/Blue-B" width="100px;" alt=""/>
        <br />
        <sub><b>Blue-B</b></sub>
      </a>
      <br />
      <sub>UI/BACKEND DEVELOPER</sub>
    </td>
    <td align="center">
      <a href="https://github.com/kjaewon4">
        <img src="https://avatars.githubusercontent.com/kjaewon4" width="100px;" alt=""/>
        <br />
        <sub><b>kjaewon4</b></sub>
      </a>
      <br />
      <sub>BLOCKCHAIN/BACKEND DEVELOPER</sub>
    </td>
    <td align="center">
      <a href="https://github.com/fjdjsfh">
        <img src="https://avatars.githubusercontent.com/fjdjsfh" width="100px;" alt=""/>
        <br />
        <sub><b>fjdjsfh</b></sub>
      </a>
      <br />
      <sub>BACKEND DEVELOPER</sub>
    </td>
    <td align="center">
      <a href="https://github.com/ley38107">
        <img src="https://avatars.githubusercontent.com/ley38107" width="100px;" alt=""/>
        <br />
        <sub><b>ley38107</b></sub>
      </a>
      <br />
      <sub>AI/ML DEVELOPER</sub>
    </td>
  </tr>
</table>

## 기여 가이드

### 개발 환경 설정

1. 이슈 생성 또는 기존 이슈 확인
2. 저장소를 Fork
3. Fork한 저장소를 로컬에 클론
4. 코드 작성 및 테스트
5. 커밋: `git commit -m "FEAT: 새로운 기능 추가"`
6. Fork한 저장소에 푸시
7. Pull Request 생성

### 커밋 컨벤션

```
FEAT: 새로운 기능 추가
FIX: 버그 수정
DOCS: 문서 수정
STYLE: 코드 포맷팅
REFACTOR: 코드 리팩토링
TEST: 테스트 코드 추가
CHORE: 빌드 업무 수정
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

<div align="center">

**Tickity** - 암표 없는 공정한 티켓팅의 시작

Made with ❤️ by Tickity Team

</div>
