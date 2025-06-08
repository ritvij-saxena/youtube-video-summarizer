const express = require("express");
const app = express();

app.use(express.json());

// Health check
app.get("/ping", (req, res) => {
  res.send("Youtube Summarizer Server works!");
});

// Summary endpoint (TODO)
app.post("/summary", (req, res) => {
  res.status(501).json({ message: "TODO: /summary not yet implemented." });
});

// Start server
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
