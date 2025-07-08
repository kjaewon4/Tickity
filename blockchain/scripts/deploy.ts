// npx hardhat run --network localhost scripts/deploy.ts
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as hardhat from 'hardhat';
import { Wallet, getAddress, ethers as ethers_ethers } from 'ethers';
import { supabase } from '../../backend/src/lib/supabaseClient';
import { toUtf8Bytes } from '@ethersproject/strings';
import { hexZeroPad } from '@ethersproject/bytes';
import { encrypt, decrypt } from '../../backend/src/utils/encryption';

//
// 1. 환경 설정
//
const envPath = path.resolve(__dirname, '../../backend/.env');
config({ path: envPath });

const BATCH_SIZE = 3;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY!;
if (!ADMIN_PRIVATE_KEY) {
  throw new Error('❌ .env에 ADMIN_PRIVATE_KEY가 설정되어 있지 않습니다.');
}
const USER_FUND_AMOUNT_WEI = BigInt('10000000000000000000000'); // 사용자 지갑에 충전할 금액 (10000 ETH)
const CONTRACT_INITIAL_FUND_AMOUNT_ETH = '10000000.0'; // 컨트랙트에 초기 충전할 ETH 양 (예: 1.0 ETH)

// HardhatRuntimeEnvironment에서 ethers 꺼내기
const { ethers } = hardhat as any;

async function main() {
  console.log('--- 배포 스크립트 시작 ---');

  //
  // 2. 컨트랙트 배포
  //
  const [deployer] = await ethers.getSigners();
  console.log(`📡 배포자: ${deployer.address}`);

  const adminWallet = new Wallet(ADMIN_PRIVATE_KEY, ethers.provider);
  console.log(`▶︎ 관리자 지갑: ${adminWallet.address}`);

  const Factory = await ethers.getContractFactory('SoulboundTicket');
  const sbt = await Factory.deploy(adminWallet.address);
  await sbt.waitForDeployment();
  const deployedContractAddress = await sbt.getAddress();
  console.log(`▶︎ SBT 배포 완료: ${deployedContractAddress}`);

  // .env 갱신
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  envContent = envContent
    .split('\n')
    .filter(l => !l.startsWith('TICKET_MANAGER_ADDRESS='))
    .concat([`TICKET_MANAGER_ADDRESS=${deployedContractAddress}`])
    .join('\n');
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('▶︎ .env 업데이트 완료: TICKET_MANAGER_ADDRESS');

  //
  // 3. 배포된 컨트랙트에 초기 ETH 충전
  //
  console.log('--- 컨트랙트 초기 이더(ETH) 충전 시작 ---');
  try {
    const amountToFundContract = ethers.parseEther(CONTRACT_INITIAL_FUND_AMOUNT_ETH);
    console.log(`충전할 금액: ${CONTRACT_INITIAL_FUND_AMOUNT_ETH} ETH`);

    const fundTx = await adminWallet.sendTransaction({
      to: deployedContractAddress,
      value: amountToFundContract,
    });
    console.log(`⏳ 컨트랙트 충전 트랜잭션 전송됨. Hash: ${fundTx.hash}`);
    await fundTx.wait();
    console.log(`✅ 컨트랙트 초기 이더 충전 완료!`);
    const newContractBalance = await ethers.provider.getBalance(deployedContractAddress);
    console.log(`💰 컨트랙트의 현재 잔액: ${ethers.formatEther(newContractBalance)} ETH`);
  } catch (error) {
    console.error(`🚨 컨트랙트 초기 이더 충전 중 오류 발생:`, error);
    // 이더 충전 실패는 치명적이므로 스크립트 중단
    process.exit(1);
  }
  console.log('--- 컨트랙트 초기 이더(ETH) 충전 완료 ---');

  //
  // 4. 사용자 지갑 초기화/충전
  //
  console.log('--- 사용자 지갑 초기화 시작 ---');
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, wallet_address, private_key_encrypted');

  if (uErr) throw uErr;
  for (const u of users || []) {
    let addr = u.wallet_address;
    let pk = u.private_key_encrypted ? decrypt(u.private_key_encrypted) : null;
    let wallet: Wallet;

    if (addr && pk) {
      try {
        wallet = new Wallet(pk, ethers.provider);
        if (getAddress(addr) !== getAddress(wallet.address)) {
          console.warn(`⚠️ ${u.id} 주소 불일치, 새로 생성`);
          wallet = Wallet.createRandom(ethers.provider);
        }
      } catch {
        wallet = Wallet.createRandom(ethers.provider);
      }
    } else {
      wallet = Wallet.createRandom(ethers.provider);
    }

    addr = wallet.address;
    pk = wallet.privateKey;
    const bal = await ethers.provider.getBalance(addr);
    if (bal < USER_FUND_AMOUNT_WEI) {
      const tx = await adminWallet.sendTransaction({ to: addr, value: USER_FUND_AMOUNT_WEI - bal });
      await tx.wait();
    }
    // DB 업데이트 생략...
  }
  console.log('▶︎ 사용자 지갑 초기화 완료');

  //
  // 5. 티켓 on-chain 동기화 (배치, 순차 처리 + 디버그)
  //
  console.log('▶︎ DB 기반 티켓 on-chain 동기화 시작');
  const { data: tickets, error: tErr } = await supabase
    .from('tickets')
    .select(`
      id,
      concert_id,
      user_id,
      nft_token_id,
      token_uri,
      seat_number,
      purchase_price
    `)
    .eq('is_cancelled', false);

  if (tErr) throw tErr;
  console.log('ℹ️ 총 티켓 수:', tickets?.length);
  console.dir(tickets, { depth: 1 });
  if (!tickets?.length) return;

  const totalBatches = Math.ceil(tickets.length / BATCH_SIZE);
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE;
    const end = start + BATCH_SIZE;
    const batch = tickets.slice(start, end);

    // console.log(`▶︎ 배치 ${batchIdx + 1}/${totalBatches}:`, batch.map(t => t?.id).join(', '))
    console.dir(batch, { depth: 1 });

    for (const [i, ticket] of batch.entries()) {
      console.log(`   🔍 batch[${i}] →`, ticket);
      // 여기서 ticket이 undefined일 가능성을 더 견고하게 방어합니다.
      if (!ticket || typeof ticket.id === 'undefined') { // ticket 객체 자체가 없거나 id 프로퍼티가 없는 경우
        console.warn(`     ⚠️ batch[${i}]가 유효하지 않은 티켓 객체입니다. 건너뜝니다. (tickets[${start + i}] 확인 필요)`);
        continue;
      }

      const ticketId       = ticket.id;
      let  concertRaw: string     = ticket.concert_id;
      const tokenId        = ticket.nft_token_id;
      const seatNumber     = ticket.seat_number;
      const uri            = ticket.token_uri!;
      const price          = ticket.purchase_price;

      // 강화된 유효성 검사 (nullish coalescing 연산자 사용)
      concertRaw = concertRaw || 'unknown_concert_id';

      if (typeof concertRaw !== 'string' || concertRaw.trim() === '') {
        console.error(`❌ 티켓 ${ticketId}: concert_id가 유효한 문자열이 아니거나 대체 후에도 비어있습니다 ('${concertRaw}'). 이 티켓은 건너_ㅂ니다.`);
        continue;
      }

        // concertId를 bytes32로 해시 (처음 mint 때와 동일하게)
        // 🔴 문제의 404 라인 대체: ethers.utils.id 대신 keccak256과 toUtf8Bytes 직접 사용
        let concertBytes: string;
        try {
            concertBytes = ethers_ethers.keccak256(ethers_ethers.toUtf8Bytes(concertRaw)); // ethers_ethers 사용
        } catch (hashError: any) {
            console.error(`     ❌ 티켓 ${ticketId}: concert_id 해싱 실패 ('${concertRaw}'):`, hashError.message);
            continue; // 해싱 실패 시 건너뜁니다.
        }

      try {
        const tx = await sbt.connect(adminWallet).mintTicket(
          tokenId,
          concertBytes,
          seatNumber,
          uri,
          price,
          { value: price }
        );
        const receipt = await tx.wait();
        // console.log(`✅ ${ticketId} mint 성공. 영수증:`, receipt); // receipt 객체 전체 출력
        console.log(`✅ ticketId: ${ticketId} mint 성공: ${receipt.hash}`);

        const { error: updErr } = await supabase
          .from('tickets')
          .update({ tx_hash: receipt.hash })
          .eq('id', ticketId);
        if (updErr) console.error(`   ❌ ${ticketId} DB 업데이트 실패:`, updErr.message);
      } catch (e: any) {
        console.error(`   ✖ ${ticketId} mint 실패:`, e.message);
      }
    }
  }

  console.log('▶︎ 동기화 완료, 스크립트 종료');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});