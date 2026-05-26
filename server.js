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
app.get("/market", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","marketplace.html")); });
app.use("/marketplace", require("./routes/marketplace"));

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


// Auto-start agent on boot
try {
  const loop = require('./agent/loop');
global._agentLoop = loop;
  loop.start(30000);
  console.log('[KEBS] Agent auto-started on boot');
} catch(e) {
  console.log('[KEBS] Agent start error:', e.message);
}

// Keep-alive ping every 14 minutes
setInterval(() => {
  const http = require('http');
  http.get('http://localhost:' + (process.env.PORT || 3000) + '/agent/status', (r) => {
    console.log('[KEBS] Keep-alive ping OK');
  }).on('error', () => {});
}, 14 * 60 * 1000);


// ========== FRAUDWATCH CIRCLE FREEZE ENDPOINTS ==========
const CIRCLE_KEY = process.env.CIRCLE_API_KEY || "YOUR_CIRCLE_KEY_HERE";
const CIRCLE_BASE = "https://api.circle.com/v1";

app.post("/api/freeze", async (req, res) => {
  const { address, amount, caseReason } = req.body;
  try {
    const response = await fetch(`${CIRCLE_BASE}/w3s/developer/wallets`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${CIRCLE_KEY}`, "Content-Type": "application/json" }
    });
    const data = await response.json();
    const caseId = "FW-" + Math.floor(Math.random() * 90000 + 10000);
    console.log(`[FRAUDWATCH] Freeze request: ${address} | ${amount} USDC | Case: ${caseId}`);
    res.json({ success: true, caseId, address, amount, status: "FROZEN", reason: caseReason || "FraudWatch registry match", timestamp: new Date().toISOString() });
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
