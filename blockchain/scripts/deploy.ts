// scripts/deploy.ts
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ethers, network } from 'hardhat'; // network 객체 추가
import { getAddress, Wallet } from 'ethers'; // Wallet 클래스 추가
import { supabase } from '../../backend/src/lib/supabaseClient'; // 백엔드의 supabaseClient 재활용
import { encrypt, decrypt } from '../../backend/src/utils/encryption'; // 암호화/복호화 유틸리티 재활용

// .env 경로 설정 (backend 폴더의 .env 사용)
const envPath = path.resolve(__dirname, '../../backend/.env');
config({ path: envPath });

// 환경 변수 검증 (adminPrivateKey가 반드시 필요)
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
if (!ADMIN_PRIVATE_KEY) {
  throw new Error('❌ .env에 ADMIN_PRIVATE_KEY가 설정되어 있지 않습니다.');
}

// 10000 ETH (10000 * 10^18 wei)
const FUND_AMOUNT_WEI = BigInt("10000000000000000000000"); 

async function main() {
  console.log('--- 배포 스크립트 시작 (컨트랙트 배포 및 사용자 지갑 초기화) ---');

  // Hardhat Network의 첫 번째 계정(deployer)을 관리자로 사용
  const [deployer] = await ethers.getSigners();
  console.log(`📡 컨트랙트 배포자 지갑: ${deployer.address}`);

  // 관리자 지갑 객체 생성 (private key를 사용하여 트랜잭션 서명)
  // Hardhat Network에서는 deployer 계정이 충분한 잔액을 가지고 있으므로,
  // 이 계정을 관리자 역할을 하는 주소로 사용합니다.
  const adminWallet = new Wallet(ADMIN_PRIVATE_KEY, ethers.provider);
  console.log(`✅ 관리자 지갑 주소: ${adminWallet.address}, 현재 잔액: ${ethers.formatEther(await ethers.provider.getBalance(adminWallet.address))} ETH`);

  // 1. SoulboundTicket 컨트랙트 배포
  const SoulboundTicketFactory = await ethers.getContractFactory('SoulboundTicket');
  const sbt = await SoulboundTicketFactory.deploy(adminWallet.address); // 컨트랙트 생성자에 관리자 주소 주입
  await sbt.waitForDeployment();
  const deployedAddress = await sbt.getAddress();
  console.log(`✅ SoulboundTicket 컨트랙트 배포 완료: ${deployedAddress}`);

  // 2. TICKET_MANAGER_ADDRESS를 .env 파일에 갱신
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  const updatedEnv = envContent
    .split('\n')
    .filter((line) => !line.startsWith('TICKET_MANAGER_ADDRESS='))
    .concat([`TICKET_MANAGER_ADDRESS=${deployedAddress}`])
    .join('\n');

  fs.writeFileSync(envPath, updatedEnv.trim() + '\n');
  console.log('📝 .env에 TICKET_MANAGER_ADDRESS 갱신 완료');

  // 3. Supabase에서 모든 사용자 조회 및 지갑 생성/충전
  console.log('--- Supabase 사용자 지갑 초기화 시작 ---');
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, wallet_address, private_key_encrypted');

  if (userErr) {
    console.error('❌ Supabase 사용자 조회 실패:', userErr.message);
    throw new Error('Supabase 사용자 조회 실패');
  }

  if (!users || users.length === 0) {
    console.log('ℹ️ Supabase에 등록된 사용자가 없습니다. 지갑을 생성할 사용자가 없습니다.');
    console.log('--- 배포 스크립트 완료 ---');
    return;
  }

  console.log(`🔍 총 ${users.length}명의 사용자에게 지갑을 생성 및 충전합니다.`);

  for (const user of users) {
    let userWalletAddress = user.wallet_address;
    let userPrivateKey = user.private_key_encrypted ? decrypt(user.private_key_encrypted) : null;
    let wallet: Wallet;

    if (userWalletAddress && userPrivateKey) {
      // 기존 지갑 정보가 있는 경우
      try {
        wallet = new Wallet(userPrivateKey, ethers.provider);
        // DB에 저장된 주소와 실제 private key로 생성된 주소가 일치하는지 확인
        if (getAddress(userWalletAddress) !== getAddress(wallet.address)) {
          console.warn(`⚠️ 사용자 ${user.id}: DB 지갑 주소 불일치 (${userWalletAddress} vs ${wallet.address}). 새 지갑 생성.`);
          wallet = Wallet.createRandom(ethers.provider);
          userWalletAddress = wallet.address;
          userPrivateKey = wallet.privateKey;
        } else {
          console.log(`➡️ 사용자 ${user.id}: 기존 지갑 사용 - ${wallet.address}`);
        }
      } catch (e) {
        // Private Key가 유효하지 않은 경우 (예: 손상 또는 잘못된 포맷)
        console.warn(`⚠️ 사용자 ${user.id}: 기존 Private Key가 유효하지 않습니다. 새 지갑 생성.`);
        wallet = Wallet.createRandom(ethers.provider);
        userWalletAddress = wallet.address;
        userPrivateKey = wallet.privateKey;
      }
    } else {
      // 지갑 정보가 없는 경우 새로 생성
      wallet = Wallet.createRandom(ethers.provider);
      userWalletAddress = wallet.address;
      userPrivateKey = wallet.privateKey;
      console.log(`✨ 사용자 ${user.id}: 새 지갑 생성 - ${userWalletAddress}`);
    }

    // 지갑 잔액 확인 및 충전
    const currentBalance = await ethers.provider.getBalance(wallet.address);
    console.log(`    현재 잔액: ${ethers.formatEther(currentBalance)} ETH`);

    if (currentBalance < FUND_AMOUNT_WEI) {
      const amountToFund = FUND_AMOUNT_WEI - currentBalance;
      try {
        // 관리자 지갑을 사용하여 트랜잭션 전송
        const tx = await adminWallet.sendTransaction({
          to: wallet.address,
          value: amountToFund,
        });
        await tx.wait(); // 트랜잭션이 블록에 포함될 때까지 대기
        console.log(`    ✅ ${ethers.formatEther(amountToFund)} ETH 충전 완료. 새 잔액: ${ethers.formatEther(await ethers.provider.getBalance(wallet.address))} ETH`);
      } catch (fundErr: any) {
        console.error(`❌ 사용자 ${user.id} (${wallet.address}) ETH 충전 실패:`, fundErr.message);
      }
    } else {
      console.log(`    🟢 충분한 잔액이 있습니다 (${ethers.formatEther(currentBalance)} ETH).`);
    }

    // Supabase DB에 지갑 정보 업데이트 (필요한 경우만)
    // 기존 지갑이 없었거나, 새로 생성되었거나, private key가 유효하지 않아 갱신된 경우
    if (!user.wallet_address || !user.private_key_encrypted || getAddress(userWalletAddress) !== getAddress(user.wallet_address)) {
        const encryptedPrivateKey = encrypt(userPrivateKey);
        const { error: updateErr } = await supabase
            .from('users')
            .update({
                wallet_address: userWalletAddress,
                private_key_encrypted: encryptedPrivateKey
            })
            .eq('id', user.id);

        if (updateErr) {
            console.error(`❌ 사용자 ${user.id} 지갑 정보 DB 업데이트 실패:`, updateErr.message);
        } else {
            console.log(`    ✅ 사용자 ${user.id} 지갑 정보 DB 업데이트 완료.`);
        }
    }
  }

  console.log('--- 배포 스크립트 완료 ---');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// npx hardhat run --network localhost scripts/deploy.ts