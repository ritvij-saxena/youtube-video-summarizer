#!/bin/bash
set -euo pipefail

echo "Setting up directories..."
mkdir -p tools/bin
cd tools

# ----------------------------------------
# Build whisper.cpp
# ----------------------------------------

if [ ! -d "whisper.cpp" ]; then
  echo "Cloning whisper.cpp..."
  git clone --depth=1 https://github.com/ggml-org/whisper.cpp.git
fi

echo "🔧 Building whisper.cpp..."
cd whisper.cpp
sh ./models/download-ggml-model.sh base.en
cmake -B build
cmake --build build --config Release
cd ..

cp whisper.cpp/build/bin/whisper-cli bin/whisper_native
echo "whisper.cpp binary copied to bin/whisper_native"

# ----------------------------------------
# Build ffmpeg
# ----------------------------------------

if [ ! -d "ffmpeg" ]; then
  echo "cloning ffmpeg..."
  git clone --depth=1 https://github.com/FFmpeg/FFmpeg.git ffmpeg
fi

echo "🔧 Building ffmpeg (this might take a few minutes)..."
cd ffmpeg
./configure --prefix="$(pwd)/build" --disable-debug --disable-doc --disable-ffplay
make -j$(nproc)
make install
cd ..

cp ffmpeg/build/bin/ffmpeg bin/ffmpeg
cp ffmpeg/build/bin/ffprobe bin/ffprobe
echo "ffmpeg binary copied to bin/ffmpeg"

# ----------------------------------------
# Download yt-dlp platform-specific binary
# ----------------------------------------

echo "Downloading yt-dlp for your platform..."

YTDLP_DEST="bin/yt-dlp"

case "$(uname -s)" in
  Darwin)
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos -o "$YTDLP_DEST"
    ;;
  Linux)
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$YTDLP_DEST"
    ;;
  MINGW*|MSYS*|CYGWIN*|Windows_NT)
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o "${YTDLP_DEST}.exe"
    YTDLP_DEST="${YTDLP_DEST}.exe"
    ;;
  *)
    echo "Unsupported OS: $(uname -s)"
    exit 1
    ;;
esac

chmod +x "$YTDLP_DEST"
echo "yt-dlp binary copied to $YTDLP_DEST"


# ----------------------------------------
# Show result
# ----------------------------------------

echo "Final binaries in bin/:"
ls -lh bin/

BINARY_COUNT=$(ls bin/ | wc -l)
if [ "$BINARY_COUNT" -ne 4 ]; then
  echo "❌ Error: Expected 4 binaries (ffmpeg, ffprobe, whisper_native, yt-dlp), but found $BINARY_COUNT."
  echo "Please check build steps manually."
  exit 1
fi

# ----------------------------------------
# Start server
# ----------------------------------------

cd ..
echo "Starting Youtube Summarizer Server..."
echo "⏳ Waiting for server to start..."
npm start
sleep 2

if curl -s http://localhost:8080/ping | grep -q "Youtube Summarizer Server works!"; then
  echo "✅ Server is up and responding"
else
  echo "❌ Server did not respond correctly to /ping"
  echo "Please check the logs and start the server manually."
  exit 1
fi

if curl -s http://localhost:11434/ | grep -q "Ollama is running"; then
  echo "✅ Ollama Server is up and responding"
else
  echo "❌ Ollama Server did not respond correctly"
  echo "Please check the logs and start the server manually."
  exit 1
fi 