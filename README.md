# YouTube Video Summarizer (Free Alternative)

I created this project because I was tired of clickbait YouTube videos. I would click them and end up wasting hours watching content that didn’t deliver on its promise. As far as I know, YouTube’s official summarization feature is only available to Premium members (I could be wrong). So this is my free alternative: a **Google Chrome extension** that summarizes any YouTube video.

You simply **copy the YouTube link**, **paste it into the extension**, **select a local model**, and **click "Start Summarizing"**. That’s it.

---

## How It Works

1. The extension sends the YouTube link to a local server.
2. The server:

   - Downloads the audio using `yt-dlp`.
   - Converts the audio to WAV (16kHz) using `ffmpeg`.
   - Transcribes the audio using `whisper.cpp` (local speech-to-text).
   - Sends the transcript to **Ollama** (or your local LLM) for summarization.

3. The summary is streamed back to the extension in real time via **Server-Sent Events (SSE)** and displayed as it is generated.

Everything runs locally. No data is sent to external servers for transcription or summarization unless you explicitly configure it otherwise.

---

## How to Install

1. **Clone this project**

   ```bash
   git clone https://github.com/ritvij-saxena/youtube-video-summarizer.git
   cd youtube-video-summarizer
   ```

2. **Run the build script**

   ```bash
   ./build.sh
   ```

   > NOTE: This was tested on macOS. You may need to adjust `build.sh` if using Windows or Linux.

3. **Load the extension in Chrome**

   - Go to `chrome://extensions/`
   - Turn on **Developer mode**
   - Click **Load Unpacked**
   - Select this project directory

4. **Use the extension**

   - Click the extension icon.
   - Paste a YouTube link.
   - Select a local model (served by Ollama).
   - Click **Start Summarizing**.

---

## Notes

- The shorter the video, the faster the process.
- The extension does have a latency, but the also speed depends on:

  - Your internet speed (for downloading the video)
  - Your machine’s performance (for transcription and summarization)

- This tool uses:

  - `yt-dlp` for downloading audio
  - `ffmpeg` for audio conversion
  - `whisper.cpp` for transcription
  - **Ollama (local LLM)** for summarization

- This is a simple Chrome extension built on a whim with minimal effort. It scratches my itch for quickly understanding what a video is about without wasting time on clickbait.
- I am happy to review any PRs that improve speed, efficiency, or features.

--- 

## Output

https://github.com/user-attachments/assets/bae9bc60-ccd6-46e2-8852-d48eb4e4c35e


