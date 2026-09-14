const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const artifacts = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", "contracts.json"), "utf8"));

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} — never guess this, set it explicitly before deploying.`);
  }
  return value;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying to ${network.name} as ${deployer.address}`);

  const feeTreasury = required("FEE_TREASURY_ADDRESS");

  const art = artifacts.TokenLocker;
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, deployer);
  const locker = await factory.deploy(deployer.address, feeTreasury);
  await locker.waitForDeployment();

  console.log(`TokenLocker deployed at: ${await locker.getAddress()}`);
  console.log("Lock fee defaults to 0 — call setLockFee(fee, treasury) as the owner if you want to charge one.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
