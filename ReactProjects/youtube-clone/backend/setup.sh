#!/bin/bash

echo "🎥 YouTube Clone Backend Setup"
echo "================================"
echo ""

# Check if FFmpeg is installed
echo "📹 Checking for FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is installed"
    ffmpeg -version | head -n 1
else
    echo "❌ FFmpeg is not installed"
    echo ""
    echo "Please install FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    exit 1
fi

echo ""
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "📁 Creating necessary directories..."
mkdir -p uploads temp encoded

echo ""
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env with your configuration"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'npm start' to start the server"
echo "3. Server will be available at http://localhost:5000"
echo ""
