const { bridgeUSDC, shouldBridge, THRESHOLD } = require("./cctp");
const { getBalances, provider } = require("./wallet");

const logs = [];
let running = false;
let intervalId;
let tickCount = 0;

function log(msg) {
  const entry = "[" + new Date().toISOString() + "] " + msg;
  logs.push(entry);
  console.log(entry);
}

async function checkNetwork() {
  try {
    const block = await provider.getBlockNumber();
    log("Network OK - block " + block);
  } catch (err) {
    log("Network error: " + err.message);
  }
}

async function checkBalances() {
  try {
    const b = await getBalances();
    log("Wallet: " + b.address + " | Native: " + b.native + " | USDC: " + b.usdc);
    if (await shouldBridge(b.usdc)) {
      log("USDC below threshold (" + THRESHOLD + ") - triggering CCTP bridge from Base Sepolia");
      const result = await bridgeUSDC(5);
      log("CCTP bridge result: " + JSON.stringify(result));
    }
  } catch (err) {
    log("Balance error: " + err.message);
  }
}

async function tick() {
  tickCount++;
  log("Agent tick #" + tickCount + " - autonomous cycle running");
  await checkNetwork();
  if (tickCount % 3 === 0) await checkBalances();
  if (tickCount % 5 === 0) log("Agent #2485 heartbeat - ERC-8004 active");
}

function start(ms) {
  ms = ms || 30000;
  if (running) return { status: "already running" };
  running = true;
  log("Kebs Agent started - autonomous mode");
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

function getLogs(n) { return logs.slice(-(n || 30)); }
function isRunning() { return running; }

module.exports = { start, stop, getLogs, isRunning };
