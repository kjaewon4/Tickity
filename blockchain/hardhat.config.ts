// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import 'hardhat-deploy';
import '@typechain/hardhat';
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

    // 내부 테스트용 네트워크
    // hardhat 네트워크는 npx hardhat node 명령으로 실행될 때 사용됩니다.
    // 별도로 url을 지정하지 않아도 Hardhat이 자체적으로 이 네트워크를 호스팅합니다.
    hardhat: {
      accounts: [
        // hardhat 네트워크에선 객체 형태로 잔액까지 지정 가능
        { privateKey: ADMIN_KEY, balance: "100000000000000000000000" }
      ]
    },
    // localhost 네트워크 정의를 제거하거나,
    // 혹은 npx hardhat node가 아닌 외부 노드에 연결할 때만 사용하도록 명확히 합니다.
    // 현재 상황에서는 localhost 네트워크 정의가 혼란을 주고 있습니다.
    // 만약 외부 노드를 위한 localhost 정의가 필요하다면,
    // 백엔드에서 이 네트워크를 사용할 때만 해당 URL을 명시적으로 사용해야 합니다.
    // 지금은 제거하는 것이 가장 안전합니다.
    // localhost: {
    //   url: "http://127.0.0.1:8545", // 이 부분 때문에 혼란이 생김
    //   accounts: [ADMIN_KEY]
    // },
  },
};

export default config;
