// scripts/deploy.ts
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ethers } from 'hardhat';
import { getAddress } from 'ethers';  

// .env 경로
const envPath = path.resolve(__dirname, '../../backend/.env');

// backend/.env에서 환경변수 로드
config({ path: envPath });

async function main() {
  const admin = process.env.ADMIN_ADDRESS;
  if (!admin) throw new Error('❌ .env에 ADMIN_ADDRESS가 없습니다');
  const adminAddress = getAddress(admin); // 명시적으로 Ethereum 주소로 변환

  // 1) 배포자 서명자
  const [deployer] = await ethers.getSigners();
  console.log('📡 Deploying contracts with:', deployer.address);

  // 2) 컨트랙트 Factory 생성
  const Factory = await ethers.getContractFactory('SoulboundTicket');

  // 3) 관리자 주소를 constructor에 주입
  const sbt = await Factory.deploy(adminAddress);

  // 4) 배포 완료 대기
  await sbt.waitForDeployment();

  // 5) 배포된 주소 출력
  const deployedAddress = await sbt.getAddress();
  console.log('✅ SoulboundTicket deployed to:', deployedAddress);

  // 6) 기존 .env 읽기
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // 7) 기존 TICKET_MANAGER_ADDRESS 라인을 덮어쓰기
  const updatedEnv = envContent
    .split('\n')
    .filter((line) => !line.startsWith('TICKET_MANAGER_ADDRESS='))
    .concat([`TICKET_MANAGER_ADDRESS=${deployedAddress}`])
    .join('\n');

  // 8) 파일 저장
  fs.writeFileSync(envPath, updatedEnv.trim() + '\n');
  console.log('📝 .env에 TICKET_MANAGER_ADDRESS 갱신 완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
