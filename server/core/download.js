const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ensureOutputDir = () => {
  const dir = path.join(__dirname, "..", "..", "output");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

function downloadAudio(url, filename = "audio.mp3") {
  return new Promise((resolve, reject) => {
    const outputDir = ensureOutputDir();
    const outputPath = path.join(outputDir, filename);

    const ytdlp = spawn("./tools/bin/yt-dlp", [
      "-x",
      "--audio-format",
      "mp3",
      "--ffmpeg-location",
      path.resolve("./tools/bin"),
      "-o",
      outputPath,
      url,
    ]);

    ytdlp.stdout.on("data", (data) => {
      console.log(`[yt-dlp] ${data}`);
    });

    ytdlp.stderr.on("data", (data) => {
      console.error(`[yt-dlp] ${data}`);
    });

    ytdlp.on("error", reject);

    ytdlp.on("close", (code) => {
      if (code === 0) {
        console.log("yt-dlp finished downloading.");
        console.log(`Download Completed: ${outputPath}`);
        resolve(outputPath);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });
  });
}

module.exports = downloadAudio;
