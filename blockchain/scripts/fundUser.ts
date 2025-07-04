import { ethers } from 'ethers';

async function fundUser() {
  const userAddress = "0xF7eEe3A78EAc4415D736a9E08688190C49C38AfC"; // 👈 실제 개인키로 복원된 주소

  // 로컬 하드햇 노드에 연결
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // 하드햇 노드의 첫 번째 계정 사용 (100000 ETH가 있는 계정)
  const accounts = await provider.send('eth_accounts', []);
  const richAccountAddress = accounts[0];
  
  console.log(`💰 Rich Account: ${richAccountAddress}`);
  console.log(`➡️ Sending ETH to ${userAddress}`);

  // ETH 전송
  const tx = await provider.send('eth_sendTransaction', [{
    from: richAccountAddress,
    to: userAddress,
    value: ethers.parseEther("10.0"), // 10 ETH
  });

  console.log("✅ 전송 완료:", tx);
}

fundUser().catch(console.error);

// npx hardhat run --network localhost scripts/fundUser.ts