const router = require("express").Router();
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const chatHistory = [];

router.post("/message", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ reply: "Agent brain is offline — add ANTHROPIC_API_KEY to activate Claude AI." });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    chatHistory.push({ role: "user", content: message });
    if (chatHistory.length > 20) chatHistory.splice(0, 2);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `You are the Kebs Protocol AI agent — an autonomous DeFi assistant running on Arc Testnet. 
You help users with:
- USDC transfers and payments on Arc Testnet
- Token swapping and bridging via Circle CCTP
- Staking USDC and earning rewards
- Creating and managing invoices
- Understanding DeFi concepts
- Monitoring on-chain activity

Kebs Protocol details:
- Network: Arc Testnet (Chain ID: 5042002)
- Agent wallet: ${process.env.AGENT_WALLET_ADDRESS || "not set"}
- KebsAgent contract: ${process.env.KEBS_AGENT_CONTRACT_ADDRESS || "not deployed"}
- KebsRegistry: ${process.env.KEBS_REGISTRY_ADDRESS || "not deployed"}
- USDC address: 0x3600000000000000000000000000000000000000

Be concise, helpful and technical. Always mention Arc Testnet context.`,
      messages: chatHistory
    });

    const reply = response.content[0].text;
    chatHistory.push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/history", (req, res) => res.json(chatHistory));
router.delete("/history", (req, res) => { chatHistory.length = 0; res.json({ success: true }); });

module.exports = router;
