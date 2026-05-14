const fs = require("fs");
const path = require("path");

const MARKET_FILE = path.join(__dirname, "../data/marketplace.json");

function ensureFile() {
  const dir = path.dirname(MARKET_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MARKET_FILE)) {
    fs.writeFileSync(MARKET_FILE, JSON.stringify({ tasks: [], bids: [] }, null, 2));
  }
}

function getData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(MARKET_FILE));
}

function saveData(data) {
  fs.writeFileSync(MARKET_FILE, JSON.stringify(data, null, 2));
}

function postTask(poster, title, description, reward, deadline) {
  const data = getData();
  const task = {
    id: "TASK-" + Date.now(),
    poster: poster.toLowerCase(),
    title,
    description,
    reward: parseFloat(reward),
    deadline: deadline || null,
    status: "open",
    winner: null,
    createdAt: new Date().toISOString(),
    bids: []
  };
  data.tasks.unshift(task);
  saveData(data);
  return task;
}

function bidTask(taskId, bidder, proposal, price) {
  const data = getData();
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return { success: false, error: "Task not found" };
  if (task.status !== "open") return { success: false, error: "Task not open" };
  const bid = {
    id: "BID-" + Date.now(),
    taskId,
    bidder: bidder.toLowerCase(),
    proposal,
    price: parseFloat(price),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  task.bids.push(bid);
  data.bids.unshift(bid);
  saveData(data);
  return { success: true, bid };
}

function acceptBid(taskId, bidId, posterAddress) {
  const data = getData();
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return { success: false, error: "Task not found" };
  if (task.poster !== posterAddress.toLowerCase()) return { success: false, error: "Not authorized" };
  const bid = task.bids.find(b => b.id === bidId);
  if (!bid) return { success: false, error: "Bid not found" };
  task.status = "in_progress";
  task.winner = bid.bidder;
  bid.status = "accepted";
  saveData(data);
  return { success: true, task, bid };
}

function completeTask(taskId, workerAddress, result) {
  const data = getData();
  const task = data.tasks.find(t => t.id === taskId);
  if (!task) return { success: false, error: "Task not found" };
  if (task.winner !== workerAddress.toLowerCase()) return { success: false, error: "Not authorized" };
  task.status = "completed";
  task.result = result;
  task.completedAt = new Date().toISOString();
  saveData(data);
  return { success: true, task };
}

function getTasks(status) {
  const data = getData();
  if (!status) return data.tasks;
  return data.tasks.filter(t => t.status === status);
}

function getTask(id) {
  return getData().tasks.find(t => t.id === id) || null;
}

function getStats() {
  const data = getData();
  const open = data.tasks.filter(t => t.status === "open").length;
  const completed = data.tasks.filter(t => t.status === "completed").length;
  const totalRewards = data.tasks.filter(t => t.status === "completed").reduce((s, t) => s + t.reward, 0);
  return { total: data.tasks.length, open, completed, totalRewards };
}

module.exports = { postTask, bidTask, acceptBid, completeTask, getTasks, getTask, getStats };
