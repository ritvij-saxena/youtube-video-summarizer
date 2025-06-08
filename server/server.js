const express = require("express");
const isValidYouTubeUrl = require("./utils/validate_youtube_url");

const app = express();

app.use(express.json());

// Health check
app.get("/ping", (req, res) => {
  res.send("Youtube Summarizer Server works!");
});

// Summary endpoint (TODO)
app.post("/summary", (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let i = 0;
  const interval = setInterval(() => {
    if (i < chunks.length) {
      res.write(`data: ${chunks[i++]}\n\n`);
    } else {
      clearInterval(interval);
      res.end();
    }
  }, 1000);
});

// Start server
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
