const router = require("express").Router();
const { postTask, bidTask, acceptBid, completeTask, getTasks, getTask, getStats } = require("../agent/marketplace");

router.get("/stats", async (req, res) => {
  try { res.json(await getStats()); } catch(e) { res.json({ error: e.message }); }
});

router.get("/tasks", async (req, res) => {
  try { res.json(await getTasks(req.query.status)); } catch(e) { res.json([]); }
});

router.get("/tasks/:id", async (req, res) => {
  try {
    const task = await getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json(task);
  } catch(e) { res.json({ error: e.message }); }
});

router.post("/tasks", async (req, res) => {
  try {
    const { poster, title, description, reward, deadline } = req.body;
    if (!title || !reward) return res.status(400).json({ error: "Title and reward required" });
    const result = await postTask(poster || "anonymous", title, description || "", reward, deadline || new Date(Date.now() + 7*24*60*60*1000).toISOString());
    res.json(result || { success: false, error: "No response" });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

router.post("/tasks/:id/bid", async (req, res) => {
  try {
    const { bidder, proposal, price } = req.body;
    if (!bidder || !proposal) return res.status(400).json({ error: "Bidder and proposal required" });
    const result = await bidTask(req.params.id, bidder, proposal, price || 0);
    res.json(result || { success: false, error: "No response" });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

router.post("/tasks/:id/accept/:bidId", async (req, res) => {
  try {
    const result = await acceptBid(req.params.id, req.params.bidId, req.body.poster);
    res.json(result || { success: false, error: "No response" });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

router.post("/tasks/:id/complete", async (req, res) => {
  try {
    const { worker, result } = req.body;
    const r = await completeTask(req.params.id, worker, result);
    res.json(r || { success: false, error: "No response" });
  } catch(e) { res.json({ success: false, error: e.message }); }
});

module.exports = router;
