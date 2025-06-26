import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("Lock", function () {
  const ONE_HOUR_IN_SECS = 60 * 60;

  async function deployLockFixture() {
    const [owner, other] = await ethers.getSigners();
    const latestTime = await time.latest();
    const unlockTime = latestTime + ONE_HOUR_IN_SECS;

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, {
      value: ethers.utils.parseEther("1.0"),
    });
    await lock.deployed();

    return { lock, unlockTime, owner, other };
  }

  it("constructor: unlockTime은 미래여야 한다", async function () {
    const latest = await time.latest();
    const Lock = await ethers.getContractFactory("Lock");
    await expect(Lock.deploy(latest - 1, { value: 0 }))
      .to.be.revertedWith("Unlock time should be in the future");
  });

  it("constructor: 예치한 ETH가 컨트랙트에 쌓인다", async function () {
    const { lock } = await loadFixture(deployLockFixture);
    const balance = await ethers.provider.getBalance(lock.address);
    expect(balance).to.equal(ethers.utils.parseEther("1.0"));
  });

  describe("withdraw", function () {
    it("unlockTime 이전에는 출금 불가", async function () {
      const { lock } = await loadFixture(deployLockFixture);
      await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
    });

    it("unlockTime 이후 소유자는 인출 가능", async function () {
      const { lock, unlockTime, owner } = await loadFixture(deployLockFixture);
      await time.increaseTo(unlockTime + 1);

      // 직접 트랜잭션을 보내고 receipt에서 이벤트를 추출
      const tx = await lock.connect(owner).withdraw();
      const receipt = await tx.wait();

      // Withdrawal 이벤트 찾기
      const event = receipt.events?.find((e:any) => e.event === "Withdrawal");
      expect(event, "Withdrawal 이벤트가 있어야 합니다").to.not.be.undefined;

      const [amount, when] = event!.args!;
      expect(amount).to.equal(ethers.utils.parseEther("1.0"));
      expect(when.toNumber()).to.be.at.least(unlockTime);
    });

    it("unlockTime 이후 소유자가 아니면 출금 불가", async function () {
      const { lock, unlockTime, other } = await loadFixture(deployLockFixture);
      await time.increaseTo(unlockTime + 1);
      await expect(lock.connect(other).withdraw()).to.be.revertedWith(
        "You aren't the owner"
      );
    });
  });
});
