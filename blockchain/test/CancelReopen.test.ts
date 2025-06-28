// test/CancelReopen.test.ts

import { expect } from 'chai';
import { ethers as hardhatEthers } from 'hardhat';
import { Contract, parseEther, Log } from 'ethers';

describe('SoulboundTicket – cancel & reopen flow', () => {
  let admin: any;
  let user: any;
  let sbt: Contract;

  // 12시간(초)
  const MAX_DELAY = 12 * 3600;

  beforeEach(async () => {
    [admin, user] = await hardhatEthers.getSigners();
    const Factory = await hardhatEthers.getContractFactory(
      'contracts/SoulboundTicket.sol:SoulboundTicket',
      admin
    );
    sbt = await Factory.deploy(admin.address);
    await sbt.waitForDeployment();

    // tokenId=1 민팅
    const price = parseEther('0.1');
    await sbt.connect(user).mintTicket(1, 'A-01', 'uri', price, { value: price });
  });

  it('cancelTicket emits TicketCancelled with reopenTime ∈ [now, now+12h)', async () => {
    // (1) cancel 호출
    const tx = await sbt.connect(admin).cancelTicket(1);
    const receipt = await tx.wait();

    // (2) 로그에서 이벤트 파싱
    const log: Log | undefined = receipt.logs.find(l => {
      try {
        const parsed = sbt.interface.parseLog(l);
        return parsed.name === 'TicketCancelled';
      } catch {
        return false;
      }
    });
    expect(log, 'TicketCancelled 이벤트가 있어야 합니다').to.exist;

    const parsed = sbt.interface.parseLog(log!);
    const reopenTimeBig: bigint = parsed.args.reopenTime;

    // (3) 타임스탬프 비교
    const block = await hardhatEthers.provider!.getBlock(receipt.blockNumber);
    const now = block.timestamp;
    const reopenTime = Number(reopenTimeBig);

    expect(reopenTime).to.be.at.least(now);
    expect(reopenTime).to.be.below(now + MAX_DELAY);

    // (4) 상태 확인
    const cancelled = await sbt.isCancelled(1);
    expect(cancelled).to.be.true;
  });

  it('reopenTicket resets isCancelled to false', async () => {
    // tokenId=2 민팅
    const price2 = parseEther('0.1');
    await sbt.connect(user).mintTicket(2, 'B-02', 'uri2', price2, { value: price2 });

    // cancel & 이벤트 파싱
    const cancelTx = await sbt.connect(admin).cancelTicket(2);
    const cancelR = await cancelTx.wait();
    const cancelLog = cancelR.logs.find(l => {
      try { return sbt.interface.parseLog(l).name === 'TicketCancelled'; }
      catch { return false; }
    })!;
    const reopenTimeBig: bigint = sbt.interface.parseLog(cancelLog).args.reopenTime;

    // 체인 타임을 재오픈 시점 이후로 옮김
    await hardhatEthers.provider!.send('evm_setNextBlockTimestamp', [Number(reopenTimeBig) + 1]);
    await hardhatEthers.provider!.send('evm_mine', []);

    // reopen 호출
    await sbt.connect(admin).reopenTicket(2);

    // 상태 확인
    const cancelledAfter = await sbt.isCancelled(2);
    expect(cancelledAfter).to.be.false;
  });

  it('cancelTicket은 소유자만 호출 가능해야 한다', async () => {
    await expect(
      sbt.connect(user).cancelTicket(1)
    ).to.be.reverted;
  });

  it('reopenTicket은 소유자만 호출 가능해야 한다', async () => {
    // 먼저 관리자 취소
    await sbt.connect(admin).cancelTicket(1);

    await expect(
      sbt.connect(user).reopenTicket(1)
    ).to.be.reverted;
  });
});
