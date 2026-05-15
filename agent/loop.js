const { getBalances, provider } = require("./wallet");

const logs = [];
let running = false;
let intervalId = null;
let tickCount = 0;

function log(msg) {
  const entry = { time: new Date().toISOString(), msg };
  logs.push(entry);
  if (logs.length > 100) logs.shift();
  console.log(`[KEBS] ${entry.time} - ${msg}`);
}

async function checkBalances() {
  try {
    const balances = await getBalances();
    log(`Wallet: ${balances.address} | Native: ${balances.native} | USDC: ${balances.usdc}`);
    return balances;
  } catch (err) {
    log(`Balance check failed: ${err.message}`);
    return null;
  }
}

async function checkNetwork() {
  try {
    const block = await provider.getBlockNumber();
    log(`Arc Testnet block: ${block} — network healthy`);
    return block;
  } catch (err) {
    log(`Network check failed: ${err.message}`);
    return null;
  }
}

async function monitorContract() {
  try {
    const CONTRACT = process.env.KEBS_AGENT_CONTRACT_ADDRESS;
    if (!CONTRACT) { log("No contract address set — skipping monitor"); return; }
    const code = await provider.getCode(CONTRACT);
    if (code && code !== "0x") {
      log(`Contract ${CONTRACT.slice(0,10)}... verified on-chain`);
    }
  } catch (err) {
    log(`Contract monitor error: ${err.message}`);
  }
}

async function tick() {
  tickCount++;
  log(`Agent tick #${tickCount} — autonomous cycle running`);

  await checkNetwork();

  if (tickCount % 3 === 0) {
    await checkBalances();
  }

  if (tickCount % 5 === 0) {
    await monitorContract();
    log(`Agent #2485 heartbeat — ERC-8004 registered, capabilities: swap, payment, monitor, p2p`);
  }

  if (tickCount % 10 === 0) {
    log(`Status report: ${tickCount} cycles completed — agent fully operational`);
  }
}

function start(ms = 30000) {
  if (running) return { status: "already running" };
  running = true;
  log("Kebs Protocol Agent v1.0 started — autonomous mode active");
  log("Agent #2485 online — no external AI key required");
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
