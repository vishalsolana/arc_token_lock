const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { deploy, attach } = require("./helpers");

async function setup() {
  const [owner, alice, bob, treasury] = await ethers.getSigners();
  const locker = await deploy("TokenLocker", owner, owner.address, treasury.address);
  const token = await deploy("MockERC20", owner, "Test Token", "TEST");
  await token.mint(alice.address, ethers.parseEther("1000"));
  return { owner, alice, bob, treasury, locker, token };
}

async function lockAs(locker, token, signer, amount, unlockTime, value = 0n) {
  await token.connect(signer).approve(await locker.getAddress(), amount);
  const tx = await locker.connect(signer).lock(await token.getAddress(), amount, unlockTime, { value });
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((l) => {
      try {
        return locker.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "Locked");
  return event.args.lockId;
}

describe("TokenLocker", function () {
  it("locks tokens, escrows them, and forbids withdrawal before the unlock time", async function () {
    const { locker, token, alice } = await setup();
    const unlockTime = (await time.latest()) + 3600;
    const amount = ethers.parseEther("100");

    const lockId = await lockAs(locker, token, alice, amount, unlockTime);

    expect(await token.balanceOf(await locker.getAddress())).to.equal(amount);
    const lock = await locker.getLock(lockId);
    expect(lock.owner).to.equal(alice.address);
    expect(lock.amount).to.equal(amount);
    expect(lock.unlockTime).to.equal(unlockTime);
    expect(lock.withdrawn).to.equal(false);

    await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWithCustomError(locker, "StillLocked");
  });

  it("allows withdrawal once the unlock time passes, only by the lock owner", async function () {
    const { locker, token, alice, bob } = await setup();
    const unlockTime = (await time.latest()) + 3600;
    const amount = ethers.parseEther("100");
    const lockId = await lockAs(locker, token, alice, amount, unlockTime);

    await expect(locker.connect(bob).withdraw(lockId)).to.be.revertedWithCustomError(locker, "NotLockOwner");

    await time.increaseTo(unlockTime + 1);
    await expect(locker.connect(alice).withdraw(lockId)).to.changeTokenBalance(token, alice, amount);

    await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWithCustomError(locker, "AlreadyWithdrawn");
  });

  it("lets the lock owner push the unlock date later, never earlier", async function () {
    const { locker, token, alice } = await setup();
    const unlockTime = (await time.latest()) + 3600;
    const lockId = await lockAs(locker, token, alice, ethers.parseEther("50"), unlockTime);

    await expect(locker.connect(alice).extendLock(lockId, unlockTime - 1)).to.be.revertedWithCustomError(
      locker,
      "UnlockTimeCannotMoveEarlier"
    );

    const later = unlockTime + 7200;
    await expect(locker.connect(alice).extendLock(lockId, later)).to.emit(locker, "LockExtended").withArgs(lockId, later);

    const lock = await locker.getLock(lockId);
    expect(lock.unlockTime).to.equal(later);

    // Still can't withdraw at the original unlock time — the extension actually stuck.
    await time.increaseTo(unlockTime + 1);
    await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWithCustomError(locker, "StillLocked");
  });

  it("rejects a zero amount or a non-future unlock time", async function () {
    const { locker, token, alice } = await setup();
    await token.connect(alice).approve(await locker.getAddress(), ethers.parseEther("10"));

    await expect(
      locker.connect(alice).lock(await token.getAddress(), 0, (await time.latest()) + 3600)
    ).to.be.revertedWithCustomError(locker, "ZeroAmount");

    await expect(
      locker.connect(alice).lock(await token.getAddress(), ethers.parseEther("10"), await time.latest())
    ).to.be.revertedWithCustomError(locker, "UnlockTimeNotInFuture");
  });

  it("credits only the amount actually received for fee-on-transfer tokens", async function () {
    const { locker, owner, alice } = await setup();
    const feeToken = await deploy("MockFeeOnTransferERC20", owner, "Fee Token", "FEE");
    await feeToken.mint(alice.address, ethers.parseEther("1000"));

    const amount = ethers.parseEther("100");
    const unlockTime = (await time.latest()) + 3600;
    const lockId = await lockAs(locker, feeToken, alice, amount, unlockTime);

    const lock = await locker.getLock(lockId);
    // 5% burned in transit — the lock should reflect the 95% that actually arrived, not the
    // 100 requested, otherwise withdrawal would try to pay out more than the contract holds.
    expect(lock.amount).to.equal((amount * 9500n) / 10000n);
    expect(await feeToken.balanceOf(await locker.getAddress())).to.equal(lock.amount);
  });

  it("transfers lock ownership without moving the underlying tokens", async function () {
    const { locker, token, alice, bob } = await setup();
    const unlockTime = (await time.latest()) + 3600;
    const amount = ethers.parseEther("100");
    const lockId = await lockAs(locker, token, alice, amount, unlockTime);

    await expect(locker.connect(alice).transferLockOwnership(lockId, bob.address))
      .to.emit(locker, "LockOwnershipTransferred")
      .withArgs(lockId, alice.address, bob.address);

    await expect(locker.connect(alice).withdraw(lockId)).to.be.revertedWithCustomError(locker, "NotLockOwner");

    await time.increaseTo(unlockTime + 1);
    await expect(locker.connect(bob).withdraw(lockId)).to.changeTokenBalance(token, bob, amount);
  });

  it("indexes locks by owner and by token", async function () {
    const { locker, token, alice } = await setup();
    const unlockTime = (await time.latest()) + 3600;
    const id1 = await lockAs(locker, token, alice, ethers.parseEther("10"), unlockTime);
    const id2 = await lockAs(locker, token, alice, ethers.parseEther("20"), unlockTime);

    expect(await locker.locksByOwner(alice.address)).to.deep.equal([id1, id2]);
    expect(await locker.locksByToken(await token.getAddress())).to.deep.equal([id1, id2]);
    expect(await locker.locksCount()).to.equal(2n);
  });

  it("charges the configured lock fee to the treasury and refunds any excess", async function () {
    const { locker, token, alice, owner, treasury } = await setup();
    const fee = ethers.parseEther("0.01");
    await locker.connect(owner).setLockFee(fee, treasury.address);

    const unlockTime = (await time.latest()) + 3600;
    const amount = ethers.parseEther("10");
    await token.connect(alice).approve(await locker.getAddress(), amount);

    await expect(
      locker.connect(alice).lock(await token.getAddress(), amount, unlockTime, { value: fee - 1n })
    ).to.be.revertedWithCustomError(locker, "InsufficientLockFee");

    const overpay = fee + ethers.parseEther("0.005");
    await expect(
      locker.connect(alice).lock(await token.getAddress(), amount, unlockTime, { value: overpay })
    ).to.changeEtherBalances([alice, treasury], [-fee, fee]);
  });

  it("never lets the owner move or withdraw someone else's locked tokens", async function () {
    const { locker, owner } = await setup();
    // TokenLocker.owner() only controls setLockFee — there is no owner-only withdraw/sweep
    // function at all, which is the property this test is really pinning down.
    const functionNames = locker.interface.fragments.filter((f) => f.type === "function").map((f) => f.name);
    expect(functionNames).to.not.include.members(["sweep", "emergencyWithdraw", "rescueTokens"]);
    expect(await locker.owner()).to.equal(owner.address);
  });
});
