#!/bin/bash
set -euo pipefail

echo "📦 Setting up directories..."
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
./configure --prefix="$(pwd)/build" --disable-debug --disable-doc --disable-ffplay --disable-ffprobe
make -j$(nproc)
make install
cd ..

cp ffmpeg/build/bin/ffmpeg bin/ffmpeg
echo "ffmpeg binary copied to bin/ffmpeg"

# ----------------------------------------
# Show result
# ----------------------------------------

echo "Final binaries in bin/:"
ls -lh bin/
