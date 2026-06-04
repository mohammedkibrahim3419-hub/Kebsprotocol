const router = require("express").Router();
const { sponsorTransfer, canSponsor } = require("../agent/paymaster");

router.get("/status", async (req, res) => {
  try {
    const status = await canSponsor(1);
    res.json({ agent: process.env.WALLET_ADDRESS, ...status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sponsor", async (req, res) => {
  const { recipient, amount } = req.body;
  if (!recipient || !amount) {
    return res.status(400).json({ error: "Missing recipient or amount" });
  }
  try {
    const result = await sponsorTransfer(recipient, parseFloat(amount));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
