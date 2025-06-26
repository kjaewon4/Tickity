// 파일: test/SoulboundTicket.test.ts

import { expect } from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import chai from "chai";

// Waffle의 solidity matcher (.to.be.revertedWith, .to.emit 등) 등록
// npm install --save-dev @types/mocha @types/chai
chai.use(solidity);

describe("SoulboundTicket 컨트랙트", function () {
  let SoulboundTicket: any;
  let ticket: any;
  let owner: any;
  let alice: any;

  beforeEach(async () => {
    // 테스트용 계정 배열 가져오기
    [owner, alice] = await ethers.getSigners();

    // 컨트랙트 팩토리 가져오기
    SoulboundTicket = await ethers.getContractFactory("SoulboundTicket");
    // 배포
    ticket = await SoulboundTicket.deploy();
    await ticket.deployed();
  });

  it("초기 nextTokenId는 1이어야 합니다", async () => {
    const nextId = await ticket.nextTokenId();
    expect(nextId).to.equal(1);
  });

  it("mintTicket 호출 시 Transfer 이벤트가 발생해야 합니다", async () => {
    await expect(
      ticket
        .connect(alice)
        .mintTicket(100, "A1", "ipfs://token-uri", { value: ethers.utils.parseEther("0.1") })
    )
      .to.emit(ticket, "Transfer")
      .withArgs(ethers.constants.AddressZero, alice.address, 1);
  });

  it("전송 시도 시 ‘SBT: 전송 불가’로 revert 되어야 합니다", async () => {
    // 1) 먼저 티켓 민팅
    await ticket
      .connect(alice)
      .mintTicket(200, "B2", "ipfs://token-uri", { value: ethers.utils.parseEther("0.1") });
    // 2) 전송 시도
    await expect(
      ticket.connect(alice).transferFrom(alice.address, owner.address, 1)
    ).to.be.revertedWith("SBT: 전송 불가");
  });

  it("얼굴 해시 등록 → 인증 → 사용 흐름이 정상 동작해야 합니다", async () => {
    // 1) mint
    await ticket
      .connect(alice)
      .mintTicket(300, "C3", "ipfs://token-uri", { value: ethers.utils.parseEther("0.1") });

    // 2) owner가 얼굴 해시 등록
    const fakeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("face123"));
    await ticket.registerFaceHash(1, fakeHash);
    const infoAfterHash = await ticket.tickets(1);
    expect(infoAfterHash.faceHash).to.equal(fakeHash);

    // 3) owner가 얼굴 인증 처리
    await ticket.markFaceVerified(1);
    const infoAfterVerify = await ticket.tickets(1);
    expect(infoAfterVerify.isFaceVerified).to.be.true;

    // 4) owner가 입장 처리
    await ticket.markAsUsed(1);
    const infoAfterUse = await ticket.tickets(1);
    expect(infoAfterUse.isUsed).to.be.true;
  });
});
