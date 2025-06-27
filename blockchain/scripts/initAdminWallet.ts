import { Wallet } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function initAdminWallet() {
  // 이미 ENV에 키가 있으면 아무것도 안 함
  if (process.env.ADMIN_PRIVATE_KEY && process.env.ADMIN_ADDRESS) {
    console.log('✅ ADMIN_PRIVATE_KEY 와 ADMIN_ADDRESS 가 이미 설정되어 있습니다.');
    console.log(`  ADMIN_ADDRESS=${process.env.ADMIN_ADDRESS}`);
    return;
  }

  // 새 랜덤 월렛 생성
  const wallet = Wallet.createRandom();
  const privKey = wallet.privateKey;
  const address = wallet.address;

  console.log('🔑 신규 관리자 지갑 생성:');
  console.log(`  주소:    ${address}`);
  console.log(`  개인키:  ${privKey}`);
  console.log();

  // .env 파일 경로
  const envPath = path.resolve(__dirname, '../../backend/.env');
  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf-8');
  } catch {
    // 파일이 없으면 새로 만들게 됨
  }

  // 줄바꿈 처리
  if (!env.endsWith('\n')) env += '\n';

  // ENV에 추가
  env += `ADMIN_PRIVATE_KEY="${privKey}"\n`;
  env += `ADMIN_ADDRESS="${address}"\n`;

  fs.writeFileSync(envPath, env, { encoding: 'utf-8' });
  console.log('✅ .env 파일에 ADMIN_PRIVATE_KEY 와 ADMIN_ADDRESS 를 추가했습니다.');
}

initAdminWallet();
