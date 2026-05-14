require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const Anthropic = require("@anthropic-ai/sdk");
const { ethers } = require("ethers");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL,
  5042002,
  { staticNetwork: true }
);

async function parseCommand(naturalLanguage, userAddress) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "Anthropic API key not set" };
  }

  const prompt = `You are a DeFi transaction parser for Kebs Protocol on Arc Testnet.

Parse this natural language command into a structured transaction:
"${naturalLanguage}"

User address: ${userAddress || "unknown"}
USDC contract: 0x3600000000000000000000000000000000000000
Network: Arc Testnet

Respond ONLY with valid JSON, no markdown:
{
  "action": "send" | "stake" | "unstake" | "claim" | "bridge" | "invoice" | "swap" | "unknown",
  "amount": <number or null>,
  "token": "USDC" | "ARC" | null,
  "recipient": "<address or null>",
  "fromChain": "<chain or null>",
  "toChain": "<chain or null>",
  "description": "<invoice description or null>",
  "confidence": <0-100>,
  "humanReadable": "<confirm message shown to user>",
  "error": "<error message if cannot parse or null>"
}

Examples:
- "send 5 USDC to 0x123" -> action: send, amount: 5, token: USDC, recipient: 0x123
- "stake 10 USDC" -> action: stake, amount: 10, token: USDC
- "bridge 2 USDC to sepolia" -> action: bridge, amount: 2, toChain: sepolia
- "invoice John 20 USDC for design work" -> action: invoice, amount: 20, description: design work
- "claim my rewards" -> action: claim
- "unstake everything" -> action: unstake, amount: null`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }]
  });

  try {
    return JSON.parse(response.content[0].text.trim());
  } catch(e) {
    return { error: "Could not parse command", action: "unknown" };
  }
}

async function executeCommand(parsed, userAddress, privateKey) {
  const { action, amount, token, recipient, fromChain, toChain, description } = parsed;

  if (parsed.error) return { success: false, error: parsed.error };
  if (parsed.confidence < 50) return { success: false, error: "Low confidence — please rephrase" };

  try {
    switch(action) {
      case "send": {
        if (!recipient || !amount) return { success: false, error: "Missing recipient or amount" };
        const wallet = new ethers.Wallet(privateKey, provider);
        const usdcAbi = ["function transfer(address to, uint256 amount) returns (bool)", "function decimals() view returns (uint8)"];
        const usdc = new ethers.Contract("0x3600000000000000000000000000000000000000", usdcAbi, wallet);
        const decimals = await usdc.decimals();
        const tx = await usdc.transfer(recipient.toLowerCase(), ethers.parseUnits(amount.toString(), decimals));
        const receipt = await tx.wait();
        return { success: true, action: "send", txHash: receipt.hash, amount, token: "USDC", recipient };
      }
      case "stake": {
        const { stakeUSDC } = require("./staking");
        return stakeUSDC(userAddress, amount);
      }
      case "unstake": {
        const { unstakeUSDC } = require("./staking");
        return unstakeUSDC(userAddress, amount || 0);
      }
      case "claim": {
        const { claimReward } = require("./staking");
        return claimReward(userAddress);
      }
      case "invoice": {
        const { createInvoice } = require("./invoices");
        return createInvoice(userAddress, recipient || userAddress, amount, description || "Invoice", null);
      }
      case "bridge": {
        const { bridgeUSDC } = require("./bridge");
        return { success: true, message: "Bridge initiated", status: "processing" };
      }
      default:
        return { success: false, error: "Unknown action: " + action };
    }
  } catch(e) {
    return { success: false, error: e.message };
  }
}

module.exports = { parseCommand, executeCommand };
