const { ethers } = require("ethers");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const ARC_RPC = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const THRESHOLD = parseFloat(process.env.CCTP_THRESHOLD || "10");

// CCTP V2 Base Sepolia contracts
const TOKEN_MESSENGER = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
const MESSAGE_TRANSMITTER = "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872";
const BASE_USDC = process.env.BASE_USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// Arc destination domain (Circle CCTP domain ID)
const ARC_DOMAIN = 9;

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)"
];

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes message, bytes attestation) returns (bool)"
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

function addressToBytes32(addr) {
  return ethers.zeroPadValue(addr, 32);
}

async function pollAttestation(messageHash, retries = 20, delay = 15000) {
  const url = `https://iris-api-sandbox.circle.com/attestations/${messageHash}`;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "complete") return data.attestation;
    console.log(`[CCTP] Waiting for attestation... (${i + 1}/${retries})`);
    await new Promise(r => setTimeout(r, delay));
  }
  throw new Error("Attestation timeout");
}

async function bridgeUSDC(amount) {
  console.log(`[CCTP] Bridging ${amount} USDC from Base Sepolia → Arc`);

  const baseProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  const arcProvider = new ethers.JsonRpcProvider(ARC_RPC);
  const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, baseProvider);
  const arcWallet = wallet.connect(arcProvider);

  const usdc = new ethers.Contract(BASE_USDC, USDC_ABI, wallet);
  const messenger = new ethers.Contract(TOKEN_MESSENGER, TOKEN_MESSENGER_ABI, wallet);
  const transmitter = new ethers.Contract(MESSAGE_TRANSMITTER, MESSAGE_TRANSMITTER_ABI, arcWallet);

  const amountWei = ethers.parseUnits(amount.toString(), 6);
  const recipient = addressToBytes32(wallet.address);

  // Approve
  console.log("[CCTP] Approving USDC...");
  const approveTx = await usdc.approve(TOKEN_MESSENGER, amountWei);
  await approveTx.wait();

  // Burn on Base Sepolia
  console.log("[CCTP] Burning USDC on Base Sepolia...");
  const burnTx = await messenger.depositForBurn(amountWei, ARC_DOMAIN, recipient, BASE_USDC);
  const receipt = await burnTx.wait();

  // Extract message hash
  const iface = new ethers.Interface(["event MessageSent(bytes message)"]);
  const log = receipt.logs.find(l => {
    try { iface.parseLog(l); return true; } catch { return false; }
  });
  if (!log) throw new Error("MessageSent event not found");
  const { message } = iface.parseLog(log).args;
  const messageHash = ethers.keccak256(message);

  // Poll attestation
  console.log(`[CCTP] Message hash: ${messageHash}`);
  const attestation = await pollAttestation(messageHash);

  // Mint on Arc
  console.log("[CCTP] Minting USDC on Arc...");
  const mintTx = await transmitter.receiveMessage(message, attestation);
  await mintTx.wait();

  console.log(`[CCTP] Bridge complete. ${amount} USDC now on Arc.`);
  return { success: true, amount, messageHash };
}

async function shouldBridge(currentBalance) {
  return parseFloat(currentBalance) < THRESHOLD;
}

module.exports = { bridgeUSDC, shouldBridge, THRESHOLD };
