const http = require("http");

/**
 * Sends transcription segments to Ollama and streams the summary.
 * @param {Object} transcriptJSON - The parsed JSON from whisper.cpp
 * @param {string} model - The Ollama model to use (e.g., "mistral")
 * @returns {Promise<void>}
 */
function summarizeTranscript(transcriptJSON, model) {
  return new Promise((resolve, reject) => {
    const prompt = `Summarize the following YouTube video transcript. Each line contains start and end timestamps:\n\n${transcriptJSON.segments
      .map((s) => `[${s.start.toFixed(2)}s - ${s.end.toFixed(2)}s] ${s.text}`)
      .join("\n")}`;

    const payload = JSON.stringify({
      model,
      stream: true,
      prompt,
    });

    const req = http.request(
      {
        hostname: "localhost",
        port: 11434,
        path: "/api/generate",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Ollama returned status ${res.statusCode}`));
        }

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          try {
            const lines = chunk
              .split("\n")
              .filter((l) => l.trim() && !l.startsWith("data: done"));
            for (const line of lines) {
              const json = JSON.parse(line.replace(/^data:\s*/, ""));
              process.stdout.write(json.response || "");
            }
          } catch (err) {
            console.error("Failed to parse chunk from Ollama:", chunk);
            reject(err);
          }
        });

        res.on("end", () => {
          console.log("\nSummarization done.");
          resolve();
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

module.exports = summarizeTranscript;
