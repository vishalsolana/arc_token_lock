const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.join(__dirname, "..", "contracts");
const OUT_FILE = path.join(__dirname, "..", "build", "contracts.json");

function findSources(dir, base, acc) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      findSources(full, base, acc);
    } else if (entry.endsWith(".sol")) {
      const rel = "contracts/" + path.relative(base, full).split(path.sep).join("/");
      acc[rel] = { content: fs.readFileSync(full, "utf8") };
    }
  }
  return acc;
}

function findImports(importPath) {
  const candidates = [
    path.join(__dirname, "..", importPath),
    path.join(__dirname, "..", "node_modules", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }
  return { error: "File not found: " + importPath };
}

const sources = findSources(CONTRACTS_DIR, path.join(__dirname, ".."), {});

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

let hasError = false;
for (const err of output.errors || []) {
  console.log(err.formattedMessage || err.message);
  if (err.severity === "error") hasError = true;
}

if (hasError) {
  process.exit(1);
}

const artifacts = {};
for (const [file, contractsInFile] of Object.entries(output.contracts)) {
  for (const [name, contract] of Object.entries(contractsInFile)) {
    artifacts[name] = {
      abi: contract.abi,
      bytecode: "0x" + contract.evm.bytecode.object,
      deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
      sourceFile: file,
    };
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(artifacts, null, 2));
console.log(`Compiled ${Object.keys(artifacts).length} contracts -> ${path.relative(process.cwd(), OUT_FILE)}`);
