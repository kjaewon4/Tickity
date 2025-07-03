import { ethers } from 'hardhat';

async function fundUser() {
  const userAddress = "0x75022888C96AC249a749a0F24EcEAb5A9BB771fa"; // 👈 로그인한 유저의 실제 지갑 주소로 변경

  // Rich 계정 가져오기
  const [richAccount] = await ethers.getSigners();

  console.log(`💰 Rich Account: ${richAccount.address}`);
  console.log(`➡️ Sending ETH to ${userAddress}`);

  const tx = await richAccount.sendTransaction({
    to: userAddress,
    value: ethers.parseEther("10.0"), // 10 ETH
  });

  await tx.wait();

  console.log("✅ 전송 완료:", tx.hash);
}

fundUser().catch(console.error);

// npx hardhat run --network localhost scripts/fundUser.ts