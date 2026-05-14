require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const solc = require("solc");
const fs = require("fs");
const path = require("path");

async function deploy() {
  console.log("Compiling KebsStaking.sol...");
  const source = fs.readFileSync(path.join(__dirname, "KebsStaking.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "KebsStaking.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    if (errors.length > 0) { console.error("Errors:", errors.map(e => e.message)); process.exit(1); }
  }
  const contract = output.contracts["KebsStaking.sol"]["KebsStaking"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  console.log("Compiled! Deploying...");
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, 1244, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  console.log("Deployer:", wallet.address.toLowerCase());
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy(process.env.USDC_CONTRACT_ADDRESS.toLowerCase());
  await deployed.waitForDeployment();
  const address = (await deployed.getAddress()).toLowerCase();
  console.log("KebsStaking deployed at:", address);
  console.log("Add to .env: KEBS_STAKING_ADDRESS=" + address);
  fs.writeFileSync(path.join(__dirname, "KebsStaking.abi.json"), JSON.stringify(abi, null, 2));
  console.log("ABI saved.");
}

deploy().catch(console.error);
