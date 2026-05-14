const router = require("express").Router();
const { createInvoice, payInvoice, cancelInvoice, getInvoices, getInvoice, getStats } = require("../agent/invoices");

router.get("/stats", (req, res) => res.json(getStats()));
router.get("/", (req, res) => res.json(getInvoices(req.query.address)));
router.get("/:id", (req, res) => {
  const inv = getInvoice(req.params.id);
  if (!inv) return res.status(404).json({ error: "Not found" });
  res.json(inv);
});
router.post("/create", (req, res) => {
  const { from, to, amount, description, dueDate } = req.body;
  if (!from || !to || !amount || !description) return res.status(400).json({ error: "Missing fields" });
  res.json(createInvoice(from, to, amount, description, dueDate));
});
router.post("/pay/:id", (req, res) => res.json(payInvoice(req.params.id, req.body.txHash)));
router.post("/cancel/:id", (req, res) => res.json(cancelInvoice(req.params.id)));

module.exports = router;
