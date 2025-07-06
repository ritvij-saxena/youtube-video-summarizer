const http = require("http");

/**
 * Sends transcription segments to Ollama and streams the summary.
 * @param {Object} transcriptJSON - The parsed JSON from whisper.cpp
 * @param {string} model - The Ollama model to use (e.g., "mistral")
 * @param {function} onData - Callback to stream data to client
 * @returns {Promise<void>}
 */

function summarizeTranscript(transcriptJSON, model, onData) {
  return new Promise((resolve, reject) => {
    let segments = transcriptJSON.transcription;
    if (!Array.isArray(segments)) {
      return reject(new Error("Invalid transcript JSON: segments not found"));
    }

    const prompt = `Summarize the following YouTube video transcript. Each line contains start and end timestamps:\n\n${segments
      .map((s) => {
        const from =
          s.timestamps?.from ||
          (s.start !== undefined ? `${s.start.toFixed(2)}s` : "?");
        const to =
          s.timestamps?.to ||
          (s.end !== undefined ? `${s.end.toFixed(2)}s` : "?");
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
        res.on("data", (chunk) => {
          try {
            const lines = chunk.split("\n").filter((l) => l.trim());

            for (const line of lines) {
              const cleanLine = line.replace(/^data:\s*/, "");
              const json = JSON.parse(cleanLine);

              if (json.response) {
                const text = json.response;
                process.stdout.write(text);
                onData(text);
              }

              if (json.done) {
                console.log("\nOllama stream finished");
              }
            }
          } catch (err) {
            console.error("Failed to parse chunk from Ollama:", chunk);
            onData(`ERROR: ${err.message}`);
            reject(err);
          }
        });

        res.on("end", () => {
          console.log("\nSummarization done.");
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = summarizeTranscript;
