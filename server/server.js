const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const isValidYouTubeUrl = require("./utils/validate_youtube_url");
const downloadAudio = require("./core/download");
const convertToWav = require("./core/convert");
const transcribeAudio = require("./core/transcribe");
const summarizeTranscript = require("./core/summarizer");

// Health check
app.get("/ping", (req, res) => {
  res.send("Youtube Summarizer Server works!");
});

// tags
app.get("/tags", async (req, res) => {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error proxying to Ollama:", err);
    res.status(500).json({ error: "Failed to connect to Ollama" });
  }
});

// summary
app.get("/summary", async (req, res) => {
  const url = req.query.url;
  console.log("In Summary");
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

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15000);

  req.on("close", () => {
    console.log("Client disconnected.");
    clearInterval(keepAlive);
  });

  try {
    console.log("Fetching Audio");
    const mp3Path = await downloadAudio(url);
    console.log(`Audio Path: ${mp3path}`);
    console.log("To WAV Audio");
    const wavPath = await convertToWav(mp3Path);
    console.log("Staring transcription");
    const transcriptJSON = await transcribeAudio(wavPath);

    await summarizeTranscript(transcriptJSON, model, (chunk) => {
      res.write(`data: ${chunk}\n\n`);
    });

    clearInterval(keepAlive);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Error in /summary:", err);
    clearInterval(keepAlive);
    res.write(`data: ERROR: ${err.message}\n\n`);
    res.end();
  }
});

// Start server
app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
