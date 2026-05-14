const router = require("express").Router();
const { getPrices } = require("../agent/prices");

router.get("/", (req, res) => res.json(getPrices()));
router.get("/latest", (req, res) => res.json(getPrices().latest));
router.get("/history/:coin", (req, res) => {
  const { history } = getPrices();
  const coin = req.params.coin.toLowerCase();
  if (!history[coin]) return res.status(404).json({ error: "Coin not found" });
  res.json(history[coin]);
});

module.exports = router;
