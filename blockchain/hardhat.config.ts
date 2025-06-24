import { HardhatUserConfig } from "hardhat/config";
// ethers v5 연동
import "@nomiclabs/hardhat-ethers";
// Waffle/Chai 매처 연결
import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-network-helpers";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",         // 컨트랙트의 pragma와 맞추세요
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,             // 최적화 정도 (기본값 200)
      },
    },
  },
  paths: {
    sources: "./contracts",    // 솔리디티 소스 위치
    tests:   "./test",         // 테스트 파일 위치
    cache:   "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      // 필요한 옵션이 있으면 여기다가 추가
    },
  },
};

export default config;
