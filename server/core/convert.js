const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function convertToWav(inputPath, outputFilename = "audio.wav") {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, "..", "..", "output");

    const outputPath = path.join(outputDir, outputFilename);

    const ffmpeg = spawn("./tools/bin/ffmpeg", [
      "-i",
      inputPath,
      "-ar",
      "16000", // sample rate: 16 kHz
      "-ac",
      "1", // mono
      "-y", // overwrite output
      outputPath,
    ]);

    ffmpeg.stdout.on("data", (data) => {
      console.log(`[ffmpeg] ${data}`);
    });

    ffmpeg.stderr.on("data", (data) => {
      console.error(`[ffmpeg] ${data}`);
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log("ffmpeg conversion complete.");
        console.log(`Audio Conversion Complete ${outputPath}`);
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

module.exports = convertToWav;
