const fs = require("fs");
const path = require("path");

const REGISTRY_FILE = path.join(__dirname, "../data/registry.json");

function ensureFile() {
  const dir = path.dirname(REGISTRY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(REGISTRY_FILE)) fs.writeFileSync(REGISTRY_FILE, JSON.stringify({ agents: [] }, null, 2));
}

function registerAgent(agentId, info) {
  ensureFile();
  const data = JSON.parse(fs.readFileSync(REGISTRY_FILE));
  const existing = data.agents.findIndex(a => a.agentId === agentId);
  const entry = { agentId, ...info, registeredAt: new Date().toISOString(), active: true };
  if (existing >= 0) data.agents[existing] = entry;
  else data.agents.push(entry);
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
  return { success: true, agentId };
}

function getAgents() {
  ensureFile();
  return JSON.parse(fs.readFileSync(REGISTRY_FILE)).agents;
}

function getActiveAgents() {
  return getAgents().filter(a => a.active);
}

function deactivateAgent(agentId) {
  ensureFile();
  const data = JSON.parse(fs.readFileSync(REGISTRY_FILE));
  const agent = data.agents.find(a => a.agentId === agentId);
  if (agent) agent.active = false;
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
  return { success: true };
}

function getStats() {
  const agents = getAgents();
  return { total: agents.length, active: agents.filter(a => a.active).length };
}

module.exports = { registerAgent, getAgents, getActiveAgents, deactivateAgent, getStats };
