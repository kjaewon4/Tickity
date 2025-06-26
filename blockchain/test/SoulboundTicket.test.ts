// test/SoulboundTicket.test.ts

import { expect } from 'chai';
// Hardhat-Ethers 플러그인이 주입하는 ethers 객체
import { ethers as hardhatEthers } from 'hardhat';
// 오직 parseEther 만 ethers 패키지에서 직접 import
import { parseEther } from 'ethers';

describe('SoulboundTicket', () => {
  let admin: any, user: any;
  let ticketAdmin: any, ticketUser: any;

  // 수수료 계산 상수 (0.1% = 1/1000)
  const FEE_NUM = 1n;
  const FEE_DEN = 1000n;

  beforeEach(async () => {
    // 1) Signer 준비 (admin, user)
    [admin, user] = await hardhatEthers.getSigners();

    // 2) fully-qualified name 으로 ContractFactory 얻기
    const Factory = await hardhatEthers.getContractFactory(
      'contracts/SoulboundTicket.sol:SoulboundTicket',
      admin
    );

    // 3) 배포 (admin 이 owner)
    ticketAdmin = await Factory.deploy(admin.address);

    // 4) user 전용 인스턴스
    ticketUser = ticketAdmin.connect(user);
  });

  it('mintTicket: 가격 검증 및 수수료 전송', async () => {
    // (1) price, fee, net 계산 (빅인트)
    const price = parseEther('0.05');
    const fee   = (price * FEE_NUM) / FEE_DEN;
    const net   = price - fee;

    // (2) mint 전 admin 잔고
    const balBefore = await hardhatEthers.provider.getBalance(admin.address);

    // (3) user가 mint 호출 (tokenId = 1)
    await ticketUser.mintTicket(1, 'A-01', 'uri', price, { value: price });

    // (4) mint 후 admin 잔고 변화 확인
    const balAfter = await hardhatEthers.provider.getBalance(admin.address);
    expect(balAfter - balBefore).to.equal(fee);

    // (5) 토큰 소유권이 user 인지 확인
    expect(await ticketAdmin.ownerOf(1)).to.equal(user.address);

    // (6) 컨트랙트에 저장된 net price 확인
    const info = await ticketAdmin.tickets(1);
    expect(info.price).to.equal(net);

    // (7) tokenURI 확인
    expect(await ticketAdmin.tokenURI(1)).to.equal('uri');
  });

  it('approve, transfer가 불가능해야 한다', async () => {
    const price = parseEther('0.05');
    // tokenId = 2
    await ticketUser.mintTicket(2, 'B-02', 'uri2', price, { value: price });

    await expect(
      ticketUser.approve(user.address, 2)
    ).to.be.revertedWith('SBT: approval disabled');

    await expect(
      ticketUser.transferFrom(user.address, admin.address, 2)
    ).to.be.revertedWith('SBT: transfer disabled');
  });

  it('관리자만 얼굴 인증·입장 처리 가능', async () => {
    const price = parseEther('0.05');
    // 간단히 32바이트 해시 생성 (0x01 + 62*'0')
    const faceHash = '0x' + '01'.padEnd(64, '0');

    // tokenId = 1 (첫 mint)
    await ticketUser.mintTicket(3, 'C-03', 'uri3', price, { value: price });

    // (1) user가 시도하면 무조건 revert
    await expect(
      ticketUser.registerFaceHash(1, faceHash)
    ).to.be.reverted;

    // (2) admin만 정상 호출 가능
    await ticketAdmin.registerFaceHash(1, faceHash);
    await ticketAdmin.markFaceVerified(1);
    await ticketAdmin.markAsUsed(1);

    // (3) 최종 상태 확인
    const t = await ticketAdmin.tickets(1);
    expect(t.isFaceVerified).to.be.true;
    expect(t.isUsed).to.be.true;
  });
});
