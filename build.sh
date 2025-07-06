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

echo "Building whisper.cpp..."
cd whisper.cpp
sh ./models/download-ggml-model.sh base.en
cmake -B build
cmake --build build --config Release
cd ..

cp whisper.cpp/build/bin/whisper-cli bin/whisper_native
echo "whisper.cpp binary copied to bin/whisper_native"

# ----------------------------------------
# Download and build libmp3lame (for mp3 support in ffmpeg)
# ----------------------------------------

if [ ! -d "lame-3.100" ]; then
  echo "Downloading libmp3lame..."
  curl -L -o lame-3.100.tar.gz https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz
  tar xzf lame-3.100.tar.gz
fi

echo "Building libmp3lame..."
cd lame-3.100
./configure --prefix="$(pwd)/build" --enable-nasm
if [[ "$(uname)" == "Darwin" ]]; then
  make -j$(sysctl -n hw.ncpu)
else
  make -j$(nproc)
fi
make install
cd ..

# ----------------------------------------
# Clone and build ffmpeg with libmp3lame support
# ----------------------------------------

if [ ! -d "ffmpeg" ]; then
  echo "Cloning ffmpeg..."
  git clone --depth=1 https://github.com/FFmpeg/FFmpeg.git ffmpeg
fi

echo "Building ffmpeg..."
cd ffmpeg

PKG_CONFIG_PATH="$(pwd)/../lame-3.100/build/lib/pkgconfig" ./configure \
  --prefix="$(pwd)/build" \
  --disable-debug --disable-doc --disable-ffplay \
  --enable-libmp3lame --enable-gpl \
  --extra-cflags="-I$(pwd)/../lame-3.100/build/include" \
  --extra-ldflags="-L$(pwd)/../lame-3.100/build/lib"

if [[ "$(uname)" == "Darwin" ]]; then
  make -j$(sysctl -n hw.ncpu)
else
  make -j$(nproc)
fi
make install

cp build/bin/ffmpeg ../bin/
cp build/bin/ffprobe ../bin/
echo "ffmpeg and ffprobe copied to tools/bin"

cd ..

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
  echo "Error: Expected 4 binaries (ffmpeg, ffprobe, whisper_native, yt-dlp), but found $BINARY_COUNT."
  echo "Please check build steps manually."
  exit 1
fi

# ----------------------------------------
# Start server
# ----------------------------------------

cd ..
echo "Starting Youtube Summarizer Server..."
echo "Waiting for server to start..."
npm start
sleep 2

if curl -s http://localhost:8080/ping | grep -q "Youtube Summarizer Server works!"; then
  echo "Server is up and responding"
else
  echo "Server did not respond correctly to /ping"
  echo "Please check the logs and start the server manually."
  exit 1
fi

if curl -s http://localhost:11434/ | grep -q "Ollama is running"; then
  echo "Ollama Server is up and responding"
else
  echo "Ollama Server did not respond correctly"
  echo "Please check the logs and start the server manually."
  exit 1
fi