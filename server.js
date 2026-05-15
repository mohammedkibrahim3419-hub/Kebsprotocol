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
app.use("/marketplace", require("./routes/marketplace"));

app.get("/landing", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","landing.html")); });
app.get("/marketplace", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","marketplace.html")); });
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

app.listen(process.env.PORT || 3000, () =>
  console.log("Kebs Protocol running on http://localhost:" + (process.env.PORT || 3000))
);
