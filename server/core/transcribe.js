const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function transcribeAudio(inputPath, outputFilename = "transcript.json") {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "..", "..", "output");
    const outputPath = path.join(outputDir, outputFilename);

    const whisper = spawn("./tools/bin/whisper_native", [
      inputPath,
      "--language",
      "en",
      "--model",
      "base.en",
      "-oj", // output as JSON
    ]);

    whisper.stdout.on("data", (data) => {
      console.log(`[whisper] ${data}`);
    });

    whisper.stderr.on("data", (data) => {
      console.error(`[whisper] ${data}`);
    });

    whisper.on("error", reject);

    whisper.on("close", (code) => {
      if (code === 0) {
        console.log("whisper.cpp transcription complete.");

        try {
          const result = fs.readFileSync(outputPath, "utf-8");
          const json = JSON.parse(result);
          resolve(json);
        } catch (err) {
          reject(
            new Error(`Failed to read or parse JSON transcription. err=${err}`)
          );
        }
      } else {
        reject(new Error(`whisper exited with code ${code}`));
      }
    });
  });
}

module.exports = transcribeAudio;
