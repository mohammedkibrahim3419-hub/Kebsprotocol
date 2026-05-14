require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const axios = require("axios");

const CHAINS = {
  arc: {
    name: "Arc Testnet",
    chainId: 1244,
    rpc: "https://arc-testnet.drpc.org",
    usdcAddress: "0x3600000000000000000000000000000000000000",
    cctpDomain: 9,
    tokenMessenger: "0x8fe6b999dc680ccfdd5bf7eb81a6f79b65a60df9",
    messageTransmitter: "0x0a992d191deec32afe36203ad87d7d289a738f81"
  },
  sepolia: {
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpc: "https://rpc.sepolia.org",
    usdcAddress: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
    cctpDomain: 0,
    tokenMessenger: "0x9f3b8679c73c2fef8b59b4f3444d4e156fb70aa5",
    messageTransmitter: "0x7865fafc2db2093669d92c0197e5d6f4055d4d20"
  },
  base_sepolia: {
    name: "Base Sepolia",
    chainId: 84532,
    rpc: "https://sepolia.base.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    cctpDomain: 6,
    tokenMessenger: "0x9f3b8679c73c2fef8b59b4f3444d4e156fb70aa5",
    messageTransmitter: "0x7865fafc2db2093669d92c0197e5d6f4055d4d20"
  }
};

const TOKEN_MESSENGER_ABI = [
  "function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)",
  "function depositForBurnWithCaller(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller) returns (uint64)"
];

const MESSAGE_TRANSMITTER_ABI = [
  "function receiveMessage(bytes message, bytes attestation) returns (bool)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const bridges = [];

async function bridgeUSDC(fromChain, toChain, amount, recipientAddress, privateKey) {
  const src = CHAINS[fromChain];
  const dst = CHAINS[toChain];

  if (!src || !dst) return { success: false, error: "Invalid chain" };

  const log = { id: Date.now().toString(), fromChain, toChain, amount, recipient: recipientAddress, status: "pending", steps: [], time: new Date().toISOString() };
  bridges.unshift(log);

  try {
    const provider = new ethers.JsonRpcProvider(src.rpc, src.chainId, { staticNetwork: true });
    const wallet = new ethers.Wallet(privateKey, provider);

    log.steps.push("Connected to " + src.name);

    // Approve USDC
    const usdc = new ethers.Contract(src.usdcAddress, ERC20_ABI, wallet);
    const decimals = await usdc.decimals();
    const parsed = ethers.parseUnits(amount.toString(), decimals);

    log.steps.push("Approving USDC...");
    const approveTx = await usdc.approve(src.tokenMessenger, parsed);
    await approveTx.wait();
    log.steps.push("Approved!");

    // Burn USDC on source chain
    const messenger = new ethers.Contract(src.tokenMessenger, TOKEN_MESSENGER_ABI, wallet);
    const recipientBytes32 = ethers.zeroPadValue(recipientAddress.toLowerCase(), 32);

    log.steps.push("Burning USDC on " + src.name + "...");
    const burnTx = await messenger.depositForBurn(
      parsed,
      dst.cctpDomain,
      recipientBytes32,
      src.usdcAddress
    );
    const burnReceipt = await burnTx.wait();
    log.burnTxHash = burnReceipt.hash;
    log.steps.push("Burned! TX: " + burnReceipt.hash);

    // Get attestation from Circle
    log.steps.push("Waiting for Circle attestation...");
    const messageHash = burnReceipt.hash;
    let attestation = null;
    let attempts = 0;

    while (!attestation && attempts < 30) {
      try {
        await new Promise(r => setTimeout(r, 10000));
        const res = await axios.get(`https://iris-api-sandbox.circle.com/attestations/${messageHash}`);
        if (res.data?.status === "complete") {
          attestation = res.data.attestation;
          log.steps.push("Attestation received!");
        }
      } catch(e) {
        attempts++;
        log.steps.push("Waiting... attempt " + attempts);
      }
    }

    if (!attestation) {
      log.status = "pending_attestation";
      log.steps.push("Attestation pending — check back later");
      saveProgress(log);
      return { success: true, status: "pending_attestation", burnTxHash: burnReceipt.hash, log };
    }

    // Mint on destination chain
    const dstProvider = new ethers.JsonRpcProvider(dst.rpc, dst.chainId, { staticNetwork: true });
    const dstWallet = new ethers.Wallet(privateKey, dstProvider);
    const transmitter = new ethers.Contract(dst.messageTransmitter, MESSAGE_TRANSMITTER_ABI, dstWallet);

    log.steps.push("Minting USDC on " + dst.name + "...");
    const mintTx = await transmitter.receiveMessage(log.messageBytes, attestation);
    const mintReceipt = await mintTx.wait();
    log.mintTxHash = mintReceipt.hash;
    log.status = "complete";
    log.steps.push("Minted! TX: " + mintReceipt.hash);

    saveProgress(log);
    return { success: true, status: "complete", burnTxHash: burnReceipt.hash, mintTxHash: mintReceipt.hash, log };

  } catch(err) {
    log.status = "failed";
    log.error = err.message;
    log.steps.push("Error: " + err.message);
    saveProgress(log);
    return { success: false, error: err.message, log };
  }
}

function saveProgress(log) {
  const idx = bridges.findIndex(b => b.id === log.id);
  if (idx >= 0) bridges[idx] = log;
}

function getBridges() { return bridges; }
function getChains() { return Object.keys(CHAINS).map(k => ({ id: k, ...CHAINS[k] })); }

module.exports = { bridgeUSDC, getBridges, getChains, CHAINS };
