const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const artifacts = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "build", "contracts.json"), "utf8"));

async function deploy(name, signer, ...args) {
  const art = artifacts[name];
  if (!art) throw new Error(`No artifact for ${name} — run scripts/compile.js first`);
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

function attach(name, address, signer) {
  const art = artifacts[name];
  return new ethers.Contract(address, art.abi, signer);
}

module.exports = { deploy, attach, artifacts };
