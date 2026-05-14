const router = require("express").Router();
const { parseCommand, executeCommand } = require("../agent/nl-transactions");
require("dotenv").config();

router.post("/parse", async (req, res) => {
  const { command, address } = req.body;
  if (!command) return res.status(400).json({ error: "No command" });
  try {
    const parsed = await parseCommand(command, address);
    res.json(parsed);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/execute", async (req, res) => {
  const { command, address } = req.body;
  if (!command) return res.status(400).json({ error: "No command" });
  try {
    const parsed = await parseCommand(command, address);
    if (parsed.error || parsed.action === "unknown") return res.json({ success: false, parsed, error: parsed.error || "Unknown command" });
    const result = await executeCommand(parsed, address, process.env.AGENT_PRIVATE_KEY);
    res.json({ success: result.success, parsed, result });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
