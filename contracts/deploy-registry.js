require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const solc = require("solc");
const fs = require("fs");
const path = require("path");
async function deploy() {
  const source = fs.readFileSync(path.join(__dirname, "KebsRegistry.sol"), "utf8");
  const input = { language: "Solidity", sources: { "KebsRegistry.sol": { content: source } }, settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } } };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts["KebsRegistry.sol"]["KebsRegistry"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  console.log("Compiled! Deploying...");
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, 1244, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy({ gasLimit: 500000 });
  await deployed.waitForDeployment();
  const address = (await deployed.getAddress()).toLowerCase();
  console.log("KebsRegistry deployed at:", address);
  fs.writeFileSync(path.join(__dirname, "KebsRegistry.abi.json"), JSON.stringify(abi, null, 2));
  console.log("ABI saved.");
}
deploy().catch(console.error);
