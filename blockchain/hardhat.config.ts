// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import 'hardhat-deploy';

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // hardhat 네트워크에서 첫 번째 계정을 deployer 로 사용
    },
  },
  typechain: {
    outDir: "typechain",   // 팩토리들이 생성될 디렉터리
    target: "ethers-v6",   // ethers 버전에 맞춰
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  networks: {
    hardhat: { /* 필요하다면 옵션 추가 */ },
  },
};

export default config;
