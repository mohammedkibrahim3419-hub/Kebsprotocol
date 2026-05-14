const router = require("express").Router();
const { getPortfolio, addCustomToken, getKnownTokens } = require("../agent/portfolio");

router.get("/:address", async (req, res) => {
  try {
    const portfolio = await getPortfolio(req.params.address);
    res.json(portfolio);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const address = process.env.AGENT_WALLET_ADDRESS;
    if (!address) return res.status(400).json({ error: "No agent wallet" });
    const portfolio = await getPortfolio(address);
    res.json(portfolio);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/token", async (req, res) => {
  try {
    const { address, tokenAddress } = req.body;
    const token = await addCustomToken(address, tokenAddress);
    res.json(token);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/tokens/list", (req, res) => res.json(getKnownTokens()));

module.exports = router;
