// Regenerates lib/abis/*.json from the compiled contracts. Run this after any change to the
// contracts package (and re-run `npm test` there first, so build/contracts.json is current).
const fs = require("fs");
const path = require("path");

const buildFile = path.join(__dirname, "..", "..", "contracts", "build", "contracts.json");
if (!fs.existsSync(buildFile)) {
  console.error("contracts/build/contracts.json not found — run `npm test` in contracts/ first.");
  process.exit(1);
}

const artifacts = JSON.parse(fs.readFileSync(buildFile, "utf8"));
const outDir = path.join(__dirname, "..", "lib", "abis");
fs.mkdirSync(outDir, { recursive: true });

for (const name of ["TokenLocker"]) {
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(artifacts[name].abi, null, 2));
}
console.log("Synced ABIs to lib/abis/");
