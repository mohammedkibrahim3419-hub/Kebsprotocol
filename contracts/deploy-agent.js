require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const solc = require("solc");
const fs = require("fs");
const path = require("path");

const RPC = process.env.RPC_URL;
const PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY;
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;
const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS;
const AGENT_ID = process.env.AGENT_ID || "kebs-agent-1";

async function deploy() {
  console.log("Compiling KebsAgent.sol...");
  const source = fs.readFileSync(path.join(__dirname, "KebsAgent.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "KebsAgent.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    if (errors.length > 0) { console.error("Compile errors:", errors.map(e => e.message)); process.exit(1); }
  }
  const contract = output.contracts["KebsAgent.sol"]["KebsAgent"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  console.log("Compiled successfully. Deploying...");
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer:", wallet.address.toLowerCase());
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy(AGENT_WALLET.toLowerCase(), USDC_ADDRESS.toLowerCase(), AGENT_ID);
  await deployed.waitForDeployment();
  const address = (await deployed.getAddress()).toLowerCase();
  console.log("KebsAgent deployed at:", address);
  console.log("Add to .env: KEBS_AGENT_CONTRACT_ADDRESS=" + address);
  fs.writeFileSync(path.join(__dirname, "KebsAgent.abi.json"), JSON.stringify(abi, null, 2));
  console.log("ABI saved.");
}

deploy().catch(console.error);
