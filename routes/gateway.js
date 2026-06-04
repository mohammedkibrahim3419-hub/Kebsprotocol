const router = require("express").Router();
const { sponsorTransfer } = require("../agent/paymaster");

const deposits = [];

// Circle Gateway webhook — fires when fiat deposit confirms as USDC
router.post("/webhook", async (req, res) => {
  const { type, data } = req.body;

  if (type !== "payments.payment_completed") {
    return res.json({ received: true });
  }

  const { amount, currency, metadata } = data || {};
  const recipient = metadata?.walletAddress;

  if (!recipient || !amount) {
    return res.status(400).json({ error: "Missing recipient or amount" });
  }

  const usdcAmount = parseFloat(amount.amount) / 1000000;

  deposits.push({
    id: data.id,
    recipient,
    amount: usdcAmount,
    currency,
    status: "processing",
    timestamp: new Date().toISOString()
  });

  console.log(`[Gateway] Fiat deposit received: ${usdcAmount} USDC → ${recipient}`);

  // Agent sponsors the USDC transfer to user
  sponsorTransfer(recipient, usdcAmount).then(result => {
    const dep = deposits.find(d => d.id === data.id);
    if (dep) dep.status = result.success ? "completed" : "failed";
    console.log(`[Gateway] Transfer result:`, result);
  });

  res.json({ received: true, processing: true });
});

// Simulate a fiat deposit (for demo/testing)
router.post("/simulate", async (req, res) => {
  const { recipient, amount } = req.body;
  if (!recipient || !amount) {
    return res.status(400).json({ error: "Missing recipient or amount" });
  }

  const deposit = {
    id: "sim_" + Date.now(),
    recipient,
    amount: parseFloat(amount),
    status: "processing",
    timestamp: new Date().toISOString()
  };
  deposits.push(deposit);

  console.log(`[Gateway] Simulated deposit: ${amount} USDC → ${recipient}`);

  sponsorTransfer(recipient, parseFloat(amount)).then(result => {
    deposit.status = result.success ? "completed" : "failed";
    deposit.txHash = result.txHash;
    console.log(`[Gateway] Sim transfer result:`, result);
  });

  res.json({ success: true, deposit });
});

router.get("/deposits", (req, res) => res.json(deposits));

module.exports = router;
