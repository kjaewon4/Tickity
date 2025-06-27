import { config } from 'dotenv';
import path from 'path';

// ✅ backend/.env에서 환경변수 로드
config({ path: path.resolve(__dirname, '../../backend/.env') });

import { writeFileSync } from 'fs';
import { ethers } from 'hardhat';

async function main() {
  const admin = process.env.ADMIN_ADDRESS;
  if (!admin) {
    throw new Error('❌ .env에 ADMIN_ADDRESS가 없습니다');
  }

  // 1) 배포자 서명자
  const [deployer] = await ethers.getSigners();
  console.log('📡 Deploying contracts with:', deployer.address);

  // 2) 컨트랙트 Factory 생성
  const Factory = await ethers.getContractFactory(
    'contracts/SoulboundTicket.sol:SoulboundTicket'
  );

  // ✅ 3) 관리자 주소를 constructor에 주입
  const sbt = await Factory.deploy(admin);

  // 4) 배포 완료 대기
  await sbt.waitForDeployment();

  // 5) 배포된 주소 출력
  const deployedAddress = await sbt.getAddress();
  console.log('✅ SoulboundTicket deployed to:', deployedAddress);

  // 6) .deployed 파일에 기록
  writeFileSync('.deployed', `TICKET_MANAGER_ADDRESS=${deployedAddress}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
