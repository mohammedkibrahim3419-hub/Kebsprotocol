const router = require("express").Router();
const { postTask, bidTask, acceptBid, completeTask, getTasks, getTask, getStats } = require("../agent/marketplace");

router.get("/stats", (req, res) => res.json(getStats()));
router.get("/tasks", (req, res) => res.json(getTasks(req.query.status)));
router.get("/tasks/:id", (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Not found" });
  res.json(task);
});
router.post("/tasks", (req, res) => {
  const { poster, title, description, reward, deadline } = req.body;
  if (!poster || !title || !reward) return res.status(400).json({ error: "Missing fields" });
  res.json(postTask(poster, title, description, reward, deadline));
});
router.post("/tasks/:id/bid", (req, res) => {
  const { bidder, proposal, price } = req.body;
  if (!bidder || !proposal || !price) return res.status(400).json({ error: "Missing fields" });
  res.json(bidTask(req.params.id, bidder, proposal, price));
});
router.post("/tasks/:id/accept/:bidId", (req, res) => {
  const { poster } = req.body;
  res.json(acceptBid(req.params.id, req.params.bidId, poster));
});
router.post("/tasks/:id/complete", (req, res) => {
  const { worker, result } = req.body;
  res.json(completeTask(req.params.id, worker, result));
});

module.exports = router;
