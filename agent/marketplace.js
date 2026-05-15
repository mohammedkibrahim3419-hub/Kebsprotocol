const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, 5042002, { staticNetwork: true });
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

const abi = JSON.parse(fs.readFileSync(path.join(__dirname, "../contracts/KebsMarketplace.abi.json"), "utf8"));
const address = process.env.KEBS_MARKETPLACE_ADDRESS;

function getContract(signer) {
  return new ethers.Contract(address, abi, signer || provider);
}

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
    const c = getContract(wallet);
    const rewardWei = ethers.parseEther(reward.toString());
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);
    const tx = await c.postTask(title, description, deadlineTs, { value: rewardWei });
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

async function bidTask(taskId, bidder, proposal, price) {
  try {
    const c = getContract(wallet);
    const tx = await c.placeBid(taskId, proposal);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

async function acceptBid(taskId, bidId, poster) {
  try {
    const c = getContract(wallet);
    const tx = await c.acceptBid(taskId, bidId);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

async function completeTask(taskId, worker, result) {
  try {
    const c = getContract(wallet);
    const tx = await c.submitCompletion(taskId, result);
    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch(e) { return { success: false, error: e.message }; }
}

module.exports = { postTask, bidTask, acceptBid, completeTask, getTasks, getTask, getStats };
