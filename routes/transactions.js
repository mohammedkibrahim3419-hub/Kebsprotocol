const router = require("express").Router();
const { provider } = require("../agent/wallet");
const { ethers } = require("ethers");
require("dotenv").config();

const txHistory = [];

function logTx(type, from, to, amount, hash, status) {
  txHistory.unshift({
    type,
    from,
    to,
    amount,
    hash,
    status,
    time: new Date().toISOString()
  });
  if (txHistory.length > 100) txHistory.pop();
}

router.get("/", (req, res) => {
  res.json(txHistory);
});

router.post("/log", (req, res) => {
  const { type, from, to, amount, hash, status } = req.body;
  logTx(type, from, to, amount, hash, status);
  res.json({ success: true });
});

router.get("/address/:address", async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const filtered = txHistory.filter(tx =>
      tx.from?.toLowerCase() === address ||
      tx.to?.toLowerCase() === address
    );
    res.json(filtered);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, logTx };
