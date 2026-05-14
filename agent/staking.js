const fs = require("fs");
const path = require("path");

const STAKING_FILE = path.join(__dirname, "../data/staking.json");
const REWARD_RATE = 0.0001; // 0.01% per minute

function ensureFile() {
  const dir = path.dirname(STAKING_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STAKING_FILE)) fs.writeFileSync(STAKING_FILE, JSON.stringify({ stakes: {}, totalStaked: 0 }, null, 2));
}

function getData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(STAKING_FILE));
}

function saveData(data) {
  fs.writeFileSync(STAKING_FILE, JSON.stringify(data, null, 2));
}

function calcReward(stake) {
  if (!stake || !stake.amount) return 0;
  const minutes = (Date.now() - new Date(stake.lastClaimed).getTime()) / 60000;
  return parseFloat((stake.amount * REWARD_RATE * minutes).toFixed(6));
}

function stakeUSDC(address, amount) {
  const data = getData();
  const addr = address.toLowerCase();
  const pending = calcReward(data.stakes[addr]);
  data.stakes[addr] = {
    amount: (data.stakes[addr]?.amount || 0) + parseFloat(amount),
    stakedAt: data.stakes[addr]?.stakedAt || new Date().toISOString(),
    lastClaimed: new Date().toISOString(),
    totalEarned: (data.stakes[addr]?.totalEarned || 0) + pending
  };
  data.totalStaked = (data.totalStaked || 0) + parseFloat(amount);
  saveData(data);
  return { success: true, staked: data.stakes[addr].amount, pending };
}

function unstakeUSDC(address, amount) {
  const data = getData();
  const addr = address.toLowerCase();
  if (!data.stakes[addr] || data.stakes[addr].amount < amount) return { success: false, error: "Insufficient stake" };
  const pending = calcReward(data.stakes[addr]);
  data.stakes[addr].amount -= parseFloat(amount);
  data.stakes[addr].totalEarned += pending;
  data.stakes[addr].lastClaimed = new Date().toISOString();
  data.totalStaked -= parseFloat(amount);
  saveData(data);
  return { success: true, unstaked: amount, reward: pending };
}

function claimReward(address) {
  const data = getData();
  const addr = address.toLowerCase();
  if (!data.stakes[addr]) return { success: false, error: "No stake found" };
  const reward = calcReward(data.stakes[addr]);
  data.stakes[addr].totalEarned += reward;
  data.stakes[addr].lastClaimed = new Date().toISOString();
  saveData(data);
  return { success: true, reward };
}

function getStake(address) {
  const data = getData();
  const addr = address.toLowerCase();
  const stake = data.stakes[addr];
  if (!stake) return { amount: 0, stakedAt: null, pending: 0, totalEarned: 0 };
  return { ...stake, pending: calcReward(stake) };
}

function getStats() {
  const data = getData();
  return {
    totalStaked: data.totalStaked || 0,
    stakerCount: Object.keys(data.stakes).filter(k => data.stakes[k].amount > 0).length,
    rewardRate: REWARD_RATE + " per minute"
  };
}

module.exports = { stakeUSDC, unstakeUSDC, claimReward, getStake, getStats };
