require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function register() {
  const abi = JSON.parse(fs.readFileSync(path.join(__dirname, "KebsRegistry.abi.json")));
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network", 5042002, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  const registry = new ethers.Contract(process.env.KEBS_REGISTRY_ADDRESS.toLowerCase(), abi, wallet);
  console.log("Registering agent...");
  const tx = await registry.register();
  const receipt = await tx.wait();
  console.log("Agent registered! TX:", receipt.hash);
  const count = await registry.count();
  console.log("Total agents:", count.toString());
  const isReg = await registry.isRegistered(wallet.address);
  console.log("Is registered:", isReg);
}

register().catch(console.error);
