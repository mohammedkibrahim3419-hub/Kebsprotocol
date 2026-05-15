const router = require("express").Router();
const { getBalances } = require("../agent/wallet");
const { getEvents, getWatchedAddresses } = require("../agent/monitor");
const { discoverAgents, sendRequest, getInbox } = require("../agent/p2p");

let loopModule;
loopModule = global._agentLoop || { start: ()=>({status:"unavailable"}), stop: ()=>({status:"unavailable"}), getLogs: ()=>[], isRunning: ()=>false };

router.post("/start", (req, res) => res.json(loopModule.start(req.body.interval)));
router.post("/stop", (req, res) => res.json(loopModule.stop()));
router.get("/status", (req, res) => res.json({ running: loopModule.isRunning(), logs: loopModule.getLogs() }));
router.get("/wallet", async (req, res) => { try { res.json(await getBalances()); } catch(e) { res.status(500).json({ error: e.message }); }});
router.get("/monitor", (req, res) => res.json({ events: getEvents(), watching: getWatchedAddresses() }));
router.get("/agents", (req, res) => res.json(discoverAgents()));
router.post("/message", (req, res) => res.json(sendRequest(req.body.from, req.body.to, req.body.type, req.body.payload)));
router.get("/inbox/:agentId", (req, res) => res.json(getInbox(req.params.agentId)));

module.exports = router;
