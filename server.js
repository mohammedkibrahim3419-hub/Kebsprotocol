require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/agent", require("./routes/agent"));
app.use("/protocol", require("./routes/protocol"));
app.use("/transactions", require("./routes/transactions").router);
app.use("/staking", require("./routes/staking"));
app.use("/bridge", require("./routes/bridge"));
app.use("/invoices", require("./routes/invoices"));
app.use("/prices", require("./routes/prices"));
app.use("/chat", require("./routes/chat"));
app.use("/portfolio", require("./routes/portfolio"));

app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Kebs Protocol running on http://localhost:" + (process.env.PORT || 3000))
);
