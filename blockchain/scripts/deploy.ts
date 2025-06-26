// scripts/deploy.ts
import 'dotenv/config';               // .env 로드
import { writeFileSync } from 'fs';   // Node.js 내장
import { ethers } from 'hardhat';

async function main() {
  // 1) 배포자 서명자
  const [deployer] = await ethers.getSigners();
  console.log('📡 Deploying contracts with:', deployer.address);

  // 2) FQN을 이용해 Factory 가져오기
  const Factory = await ethers.getContractFactory(
    'contracts/SoulboundTicket.sol:SoulboundTicket'
  );

  // 3) 배포 (constructor 인자로 admin 주소 전달)
  const sbt = await Factory.deploy(deployer.address);

  // 4) v6 방식으로 배포 대기
  await sbt.waitForDeployment();

  // 5) 주소 조회
  const deployedAddress = await sbt.getAddress();
  console.log('✅ SoulboundTicket deployed to:', deployedAddress);

  // 6) .deployed 파일에 기록
  writeFileSync('.deployed', `TICKET_MANAGER_ADDRESS=${deployedAddress}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
