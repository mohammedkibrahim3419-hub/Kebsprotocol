const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const ARC_RPC = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || "0x3600000000000000000000000000000000000000";

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(ARC_RPC);

function getAgentWallet() {
  return new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
}

// Estimate gas cost in USDC terms
async function estimateGasCostUSDC(txData) {
  try {
    const feeData = await provider.getFeeData();
    const gasEstimate = await provider.estimateGas(txData);
    const gasCostWei = gasEstimate * feeData.gasPrice;
    // Arc uses USDC-denominated gas — return as USDC units (6 decimals)
    return ethers.formatUnits(gasCostWei, 6);
  } catch (err) {
    return "0.001"; // fallback estimate
  }
}

// Agent sponsors a USDC transfer on behalf of user
async function sponsorTransfer(recipientAddress, amountUSDC) {
  try {
    const agent = getAgentWallet();
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, agent);

    const amountWei = ethers.parseUnits(amountUSDC.toString(), 6);

    // Check agent USDC balance
    const balance = await usdc.balanceOf(agent.address);
    if (balance < amountWei) {
      return { success: false, error: "Insufficient agent USDC balance" };
    }

    // Agent sends USDC — covers gas from native balance
    const tx = await usdc.transfer(recipientAddress, amountWei);
    const receipt = await tx.wait();

    console.log(`[Paymaster] Sponsored transfer: ${amountUSDC} USDC → ${recipientAddress}`);
    console.log(`[Paymaster] Tx hash: ${receipt.hash}`);

    return {
      success: true,
      txHash: receipt.hash,
      amount: amountUSDC,
      recipient: recipientAddress,
      gasUsed: receipt.gasUsed.toString(),
      sponsored: true
    };
  } catch (err) {
    console.error("[Paymaster] Error:", err.message);
    return { success: false, error: err.message };
  }
}

// Check if agent can sponsor (has enough native for gas + USDC for transfer)
async function canSponsor(amountUSDC) {
  try {
    const agent = getAgentWallet();
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, agent);
    const [nativeBalance, usdcBalance] = await Promise.all([
      provider.getBalance(agent.address),
      usdc.balanceOf(agent.address)
    ]);
    const amountWei = ethers.parseUnits(amountUSDC.toString(), 6);
    const hasUSDC = usdcBalance >= amountWei;
    const hasGas = nativeBalance > ethers.parseEther("0.001");
    return { canSponsor: hasUSDC && hasGas, hasUSDC, hasGas };
  } catch (err) {
    return { canSponsor: false, error: err.message };
  }
}

module.exports = { sponsorTransfer, canSponsor, estimateGasCostUSDC };
