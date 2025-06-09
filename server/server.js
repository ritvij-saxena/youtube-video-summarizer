const express = require("express");
const app = express();
app.use(express.json());

const isValidYouTubeUrl = require("./utils/validate_youtube_url");
const downloadAudio = require("./core/download");
const convertToWav = require("./core/convert");
const transcribeAudio = require("./core/transcribe");
const summarizeTranscript = require("./core/summarizer");

// Health check
app.get("/ping", (req, res) => {
  res.send("Youtube Summarizer Server works!");
});

app.post("/summary", async (req, res) => {
  const url = req.query.url;
  const model = req.query.model;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  if (!model) {
    return res.status(400).json({ error: "Missing 'model' query parameter." });
  }

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: "Invalid YouTube URL." });
  }

  // Setup SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const mp3Path = await downloadAudio(url);
    const wavPath = await convertToWav(mp3Path);
    const transcriptJSON = await transcribeAudio(wavPath);

    await summarizeTranscript(transcriptJSON, model, (chunk) => {
      res.write(`data: ${chunk}\n\n`);
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Error in /summary:", err);
    res.write(`data: ERROR: ${err.message}\n\n`);
    res.end();
  }
});

// Start server
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
