const http = require("http");

/**
 * Sends transcription segments to Ollama and streams the summary.
 * @param {Object} transcriptJSON - The parsed JSON from whisper.cpp
 * @param {string} model - The Ollama model to use (e.g., "mistral")
 * @param {(chunk: string) => void} onChunk - Callback invoked for each chunk of streamed text
 * @returns {Promise<void>}
 */
function summarizeTranscript(transcriptJSON, model, onChunk) {
  return new Promise((resolve, reject) => {
    let segments = transcriptJSON.transcription;
    if (!Array.isArray(segments)) {
      return reject(new Error("Invalid transcript JSON: segments not found"));
    }

    const prompt = `Summarize the following YouTube video transcript. Each line contains start and end timestamps:\n\n${segments
      .map((s) => {
        const from =
          s.timestamps?.from ||
          (s.start !== undefined ? s.start.toFixed(2) + "s" : "?");
        const to =
          s.timestamps?.to ||
          (s.end !== undefined ? s.end.toFixed(2) + "s" : "?");
        return `[${from} - ${to}] ${s.text}`;
      })
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

        let buffer = "";

        res.on("data", (chunk) => {
          buffer += chunk;

          let lines = buffer.split("\n");
          // Keep last partial line in buffer
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.trim() || line.startsWith("data: done")) continue;

            try {
              const json = JSON.parse(line.replace(/^data:\s*/, ""));
              if (json.response) {
                onChunk(json.response); // send raw response to caller
                process.stdout.write(json.response);
              }
            } catch (err) {
              console.error("Failed to parse chunk from Ollama:", line);
              reject(err);
            }
          }
        });

        res.on("end", () => {
          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer.replace(/^data:\s*/, ""));
              if (json.response) {
                onChunk(json.response);
                process.stdout.write(json.response);
              }
            } catch (err) {
              console.error("Failed to parse final chunk from Ollama:", buffer);
            }
          }
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
