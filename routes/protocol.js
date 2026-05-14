const router = require("express").Router();
const { registerAgent, discoverAgents } = require("../agent/p2p");

router.get("/info", (req, res) => res.json({
  name: "Kebs Protocol",
  version: "1.0.0",
  network: "Arc Testnet",
  rpc: process.env.RPC_URL,
  capabilities: ["swap", "payment", "monitor", "agent-to-agent"]
}));

router.post("/register", (req, res) => res.json(registerAgent(req.body.agentId, req.body.info)));
router.get("/agents", (req, res) => res.json(discoverAgents()));

module.exports = router;
