// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import 'hardhat-deploy';
import * as dotenv from "dotenv";
dotenv.config({ path: "../backend/.env" }); // 실제 .env 경로에 맞춰주세요

const ADMIN_KEY = process.env.ADMIN_PRIVATE_KEY!;
if (!ADMIN_KEY) {
  throw new Error("ADMIN_PRIVATE_KEY가 환경변수에 설정되어 있지 않습니다.");
}
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
     localhost: {
      url: "http://127.0.0.1:8545",
      // 배열 안에 문자열(privateKey)만 넣습니다.
      accounts: [ADMIN_KEY]
    },
    // 내부 테스트용 네트워크
    hardhat: {
      accounts: [
        // hardhat 네트워크에선 객체 형태로 잔액까지 지정 가능
        { privateKey: ADMIN_KEY, balance: "10000000000000000000000" }
      ]
    }
  },
};

export default config;
