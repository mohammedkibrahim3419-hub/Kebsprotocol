const router = require("express").Router();
const { bridgeUSDC, getBridges, getChains } = require("../agent/bridge");
require("dotenv").config();

router.get("/chains", (req, res) => res.json(getChains()));
router.get("/history", (req, res) => res.json(getBridges()));

router.post("/transfer", async (req, res) => {
  const { fromChain, toChain, amount, recipient } = req.body;
  if (!fromChain || !toChain || !amount || !recipient) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  res.json({ success: true, message: "Bridge initiated", status: "processing" });
  bridgeUSDC(fromChain, toChain, amount, recipient, privateKey).then(result => {
    console.log("Bridge result:", result.status);
  });
});

router.get("/status/:id", (req, res) => {
  const bridge = getBridges().find(b => b.id === req.params.id);
  if (!bridge) return res.status(404).json({ error: "Not found" });
  res.json(bridge);
});

module.exports = router;
