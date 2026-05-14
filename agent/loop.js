
const { registerAgent } = require("./registry");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { getBalances } = require("./wallet");
const { logEvent } = require("./monitor");

let running = false;
let intervalId = null;
const logs = [];

function log(msg) {
  const entry = { time: new Date().toISOString(), msg };
  logs.push(entry);
  if (logs.length > 100) logs.shift();
  console.log(`[KEBS] ${entry.time} - ${msg}`);
}

async function tick() {
  try {
    log("Checking balances...");
    const balances = await getBalances();
    log(`Native: ${balances.native} | USDC: ${balances.usdc}`);
    log("Holding — agent brain inactive until Anthropic key added.");
  } catch(err) {
    log(`Error: ${err.message}`);
  }
}

function start(ms = 60000) {
  if (running) return { status: "already running" };
  running = true;
  log("Kebs Protocol Agent started.");
  tick();
  intervalId = setInterval(tick, ms);
  return { status: "started", interval: ms };
}

function stop() {
  if (!running) return { status: "not running" };
  clearInterval(intervalId);
  running = false;
  log("Agent stopped.");
  return { status: "stopped" };
}

function getLogs(n = 30) { return logs.slice(-n); }
function isRunning() { return running; }

module.exports = { start, stop, getLogs, isRunning };

registerAgent("kebs-agent-1", { wallet: process.env.AGENT_WALLET_ADDRESS, contract: process.env.KEBS_AGENT_CONTRACT_ADDRESS, capabilities: ["swap","payment","monitor","p2p"], version: "1.0.0" });
