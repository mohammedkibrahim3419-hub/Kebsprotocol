const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, 5042002, { staticNetwork: true });
function getWallet() { return new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider); }

const abi = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "agent", "type": "address"}], "name": "BidAccepted", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "agent", "type": "address"}, {"indexed": false, "internalType": "string", "name": "proposal", "type": "string"}], "name": "BidPlaced", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "TaskCancelled", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "agent", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}], "name": "TaskCompleted", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "TaskDisputed", "type": "event"}, {"anonymous": false, "inputs": [{"indexed": true, "internalType": "uint256", "name": "id", "type": "uint256"}, {"indexed": true, "internalType": "address", "name": "poster", "type": "address"}, {"indexed": false, "internalType": "string", "name": "title", "type": "string"}, {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}], "name": "TaskPosted", "type": "event"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "uint256", "name": "bidIndex", "type": "uint256"}], "name": "acceptBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "agentCompletions", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "agentEarnings", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "agentTasks", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "bids", "outputs": [{"internalType": "address", "name": "agent", "type": "address"}, {"internalType": "string", "name": "proposal", "type": "string"}, {"internalType": "uint256", "name": "bidTime", "type": "uint256"}, {"internalType": "bool", "name": "accepted", "type": "bool"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "cancelTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "disputeTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "agent", "type": "address"}], "name": "getAgentStats", "outputs": [{"internalType": "uint256", "name": "earnings", "type": "uint256"}, {"internalType": "uint256", "name": "completions", "type": "uint256"}, {"internalType": "uint256", "name": "activeTasks", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "getOpenTasks", "outputs": [{"components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "address", "name": "poster", "type": "address"}, {"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}, {"internalType": "enum KebsMarketplace.TaskStatus", "name": "status", "type": "uint8"}, {"internalType": "address", "name": "assignedAgent", "type": "address"}, {"internalType": "string", "name": "completionProof", "type": "string"}, {"internalType": "uint256", "name": "createdAt", "type": "uint256"}], "internalType": "struct KebsMarketplace.MarketTask[]", "name": "", "type": "tuple[]"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "getStats", "outputs": [{"internalType": "uint256", "name": "total", "type": "uint256"}, {"internalType": "uint256", "name": "open", "type": "uint256"}, {"internalType": "uint256", "name": "completed", "type": "uint256"}, {"internalType": "uint256", "name": "volume", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "getTaskBids", "outputs": [{"components": [{"internalType": "address", "name": "agent", "type": "address"}, {"internalType": "string", "name": "proposal", "type": "string"}, {"internalType": "uint256", "name": "bidTime", "type": "uint256"}, {"internalType": "bool", "name": "accepted", "type": "bool"}], "internalType": "struct KebsMarketplace.Bid[]", "name": "", "type": "tuple[]"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "string", "name": "proposal", "type": "string"}], "name": "placeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [], "name": "platformFee", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}], "name": "postTask", "outputs": [], "stateMutability": "payable", "type": "function"}, {"inputs": [{"internalType": "address", "name": "", "type": "address"}, {"internalType": "uint256", "name": "", "type": "uint256"}], "name": "posterTasks", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}], "name": "releasePayment", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "bool", "name": "payAgent", "type": "bool"}], "name": "resolveDispute", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "fee", "type": "uint256"}], "name": "setPlatformFee", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}, {"internalType": "string", "name": "proof", "type": "string"}], "name": "submitCompletion", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [], "name": "taskCount", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "tasks", "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {"internalType": "address", "name": "poster", "type": "address"}, {"internalType": "string", "name": "title", "type": "string"}, {"internalType": "string", "name": "description", "type": "string"}, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {"internalType": "uint256", "name": "deadline", "type": "uint256"}, {"internalType": "enum KebsMarketplace.TaskStatus", "name": "status", "type": "uint8"}, {"internalType": "address", "name": "assignedAgent", "type": "address"}, {"internalType": "string", "name": "completionProof", "type": "string"}, {"internalType": "uint256", "name": "createdAt", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "totalVolume", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"stateMutability": "payable", "type": "receive"}];
const address = process.env.KEBS_MARKETPLACE_ADDRESS;

function getContract(signer) { return new ethers.Contract(address, abi, signer || provider); }

async function getStats() {
  try {
    const c = getContract();
    const s = await c.getStats();
    return { total: s[0].toString(), open: s[1].toString(), completed: s[2].toString(), volume: ethers.formatEther(s[3]) };
  } catch(e) { return { total: 0, open: 0, completed: 0, volume: "0", error: e.message }; }
}

async function getTasks(status) {
  try {
    const c = getContract();
    const tasks = await c.getOpenTasks();
    return tasks.map(t => ({
      id: t.id.toString(),
      poster: t.poster,
      title: t.title,
      description: t.description,
      reward: ethers.formatEther(t.reward),
      deadline: new Date(Number(t.deadline) * 1000).toISOString(),
      status: ["Open","Assigned","Completed","Disputed","Cancelled"][Number(t.status)],
      assignedAgent: t.assignedAgent,
      createdAt: new Date(Number(t.createdAt) * 1000).toISOString()
    }));
  } catch(e) { return []; }
}

async function getTask(id) {
  try {
    const c = getContract();
    const t = await c.tasks(id);
    return {
      id: t.id.toString(),
      poster: t.poster,
      title: t.title,
      description: t.description,
      reward: ethers.formatEther(t.reward),
      deadline: new Date(Number(t.deadline) * 1000).toISOString(),
      status: ["Open","Assigned","Completed","Disputed","Cancelled"][Number(t.status)],
      assignedAgent: t.assignedAgent,
      completionProof: t.completionProof
    };
  } catch(e) { return null; }
}

async function postTask(poster, title, description, reward, deadline) {
  try {
    const c = getContract(getWallet());
    const rewardWei = ethers.parseEther(reward.toString());
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
    const tx = await c.postTask(title, description, deadlineTs, { value: rewardWei, gasLimit: 500000 });
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) {
    console.log("postTask error:", e.message);
    return { success: false, error: e.message };
  }
}

async function bidTask(taskId, bidder, proposal, price) {
  try {
    const c = getContract(getWallet());
    const tx = await c.placeBid(taskId, proposal);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

async function acceptBid(taskId, bidId, poster) {
  try {
    const c = getContract(getWallet());
    const tx = await c.acceptBid(taskId, bidId);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

async function completeTask(taskId, worker, result) {
  try {
    const c = getContract(getWallet());
    const tx = await c.submitCompletion(taskId, result);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

module.exports = { postTask, bidTask, acceptBid, completeTask, getTasks, getTask, getStats };
