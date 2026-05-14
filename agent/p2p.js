const registry = new Map();
const inbox = [];

function registerAgent(agentId, info) {
  registry.set(agentId, { ...info, registeredAt: new Date().toISOString() });
  return { success: true, agentId };
}

function discoverAgents() {
  return [...registry.entries()].map(([id, info]) => ({ id, ...info }));
}

function sendRequest(fromAgent, toAgent, type, payload) {
  const msg = { id: Date.now().toString(), from: fromAgent, to: toAgent, type, payload, status: "pending", time: new Date().toISOString() };
  inbox.push(msg);
  if (inbox.length > 100) inbox.shift();
  return msg;
}

function getInbox(agentId) {
  return inbox.filter(m => m.to === agentId && m.status === "pending");
}

module.exports = { registerAgent, discoverAgents, sendRequest, getInbox };
