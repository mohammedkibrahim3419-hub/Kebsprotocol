require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/agent", require("./routes/agent"));
app.use("/protocol", require("./routes/protocol"));
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});
app.listen(3000, () => console.log("Kebs Protocol running on http://localhost:3000"));
