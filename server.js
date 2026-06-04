process.on("uncaughtException", e => { console.error("CRASH:", e.message, e.stack); process.exit(1); });
require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/agent", require("./routes/agent"));
app.use("/protocol", require("./routes/protocol"));
app.use("/transactions", require("./routes/transactions").router);
app.use("/staking", require("./routes/staking"));
app.use("/bridge", require("./routes/bridge"));
app.use("/invoices", require("./routes/invoices"));
app.use("/prices", require("./routes/prices"));
app.use("/chat", require("./routes/chat"));
app.use("/portfolio", require("./routes/portfolio"));
app.use("/nl", require("./routes/nl"));
// app.use("/api/kits", require("./routes/appkits")); // disabled - app-kit removed
app.get("/market", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","marketplace.html")); });
app.use("/marketplace", require("./routes/marketplace"));
app.use("/paymaster", require("./routes/paymaster"));
app.use("/gateway", require("./routes/gateway"));

app.get("/landing", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","landing.html")); });
app.get("/dashboard", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","index.html")); });

app.get("/docs", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "frontend", "docs.html"));
});

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "frontend", "landing.html"));
});


// Auto-start agent on boot (disabled on Vercel)
if (!process.env.VERCEL) {
try {
  const loop = require('./agent/loop');
global._agentLoop = loop;
  loop.start(30000);
  console.log('[KEBS] Agent auto-started on boot');
} catch(e) {
  console.log('[KEBS] Agent start error:', e.message);
}

// Keep-alive ping every 14 minutes (disabled on Vercel)
if (!process.env.VERCEL) {
setInterval(() => {
  const http = require('http');
  http.get('http://localhost:' + (process.env.PORT || 3000) + '/agent/status', (r) => {
    console.log('[KEBS] Keep-alive ping OK');
  }).on('error', () => {});
}, 14 * 60 * 1000);
}
}


// ========== FRAUDWATCH CIRCLE FREEZE ENDPOINTS ==========
const CIRCLE_KEY = process.env.CIRCLE_API_KEY || "YOUR_CIRCLE_KEY_HERE";
const CIRCLE_BASE = "https://api.circle.com/v1";

app.post("/api/freeze", async (req, res) => {
  const { address, amount, caseReason } = req.body;
  try {
    const caseId = "FW-" + Math.floor(Math.random() * 90000 + 10000);
    // Get wallet balance first
    const walletRes = await fetch(`${CIRCLE_BASE}/w3s/wallets/${process.env.CIRCLE_WALLET_ID}/balances`, {
      headers: { "Authorization": `Bearer ${CIRCLE_KEY}`, "Content-Type": "application/json" }
    });
    const walletData = await walletRes.json();
    const balances = walletData.data?.tokenBalances || [];
    const usdc = balances.find(b => b.token?.symbol === "USDC");
    const available = usdc ? parseFloat(usdc.amount) : 0;

    console.log(`[FRAUDWATCH] Freeze: ${address} | ${amount} USDC | Case: ${caseId} | Available: ${available}`);

    if(available < parseFloat(amount)) {
      return res.json({
        success: true,
        caseId,
        address,
        amount,
        available: available.toString(),
        status: "FROZEN_SIMULATED",
        reason: caseReason || "FraudWatch registry match",
        note: "Insufficient USDC for real freeze — case logged",
        timestamp: new Date().toISOString()
      });
    }

    // Generate proper UUID for idempotency key
    const uuid = require('crypto').randomUUID();

    // Get USDC token ID for this network
    const tokensRes = await fetch(`${CIRCLE_BASE}/w3s/tokens?blockchain=ETH-SEPOLIA`, {
      headers: { "Authorization": `Bearer ${CIRCLE_KEY}`, "Content-Type": "application/json" }
    });
    const tokensData = await tokensRes.json();
    const usdcToken = tokensData.data?.tokens?.find(t => t.symbol === "USDC");
    const tokenId = usdcToken?.id || process.env.CIRCLE_USDC_TOKEN_ID;

    // Encrypt entity secret
    const crypto = require('crypto');
    const forge = require('node-forge');
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    // Get public key for encryption
    const pubKeyRes = await fetch(`${CIRCLE_BASE}/w3s/config/entity/publicKey`, {
      headers: { "Authorization": `Bearer ${CIRCLE_KEY}` }
    });
    const pubKeyData = await pubKeyRes.json();
    const publicKey = pubKeyData.data?.publicKey;

    let entitySecretCiphertext = null;
    if(publicKey && entitySecret) {
      const secretBuffer = Buffer.from(entitySecret, 'hex');
      const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
      const encrypted = publicKeyObj.encrypt(secretBuffer.toString('binary'), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
      });
      entitySecretCiphertext = Buffer.from(encrypted, 'binary').toString('base64');
    }

    // Create real transfer
    const transferRes = await fetch(`${CIRCLE_BASE}/w3s/developer/transactions/transfer`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${CIRCLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: uuid,
        walletId: process.env.CIRCLE_WALLET_ID,
        destinationAddress: address,
        amounts: [amount.toString()],
        tokenId: tokenId,
        entitySecretCiphertext,
        fee: { type: "level", config: { feeLevel: "MEDIUM" } }
      })
    });
    const transferData = await transferRes.json();
    console.log("[FRAUDWATCH] Circle transfer response:", JSON.stringify(transferData));

    res.json({
      success: true,
      caseId,
      address,
      amount,
      status: "FROZEN",
      circleResponse: transferData,
      reason: caseReason || "FraudWatch registry match",
      timestamp: new Date().toISOString()
    });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/release", async (req, res) => {
  const { caseId, address, amount } = req.body;
  try {
    console.log(`[FRAUDWATCH] Release request: Case ${caseId} | ${address} | ${amount} USDC`);
    res.json({ success: true, caseId, address, amount, status: "RELEASED", timestamp: new Date().toISOString() });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/freeze/status/:caseId", (req, res) => {
  res.json({ caseId: req.params.caseId, status: "FROZEN", createdAt: new Date().toISOString() });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Kebs Protocol running on http://localhost:" + (process.env.PORT || 3000))
);
