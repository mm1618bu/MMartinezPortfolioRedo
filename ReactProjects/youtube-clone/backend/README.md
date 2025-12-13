# YouTube Clone Backend API

Backend server with FFmpeg integration for video encoding and processing.

## Features

- ✅ Video metadata extraction (resolution, codec, duration, bitrate, etc.)
- ✅ Thumbnail generation at any timestamp
- ✅ Video encoding to multiple quality presets (1080p, 720p, 480p, 360p)
- ✅ Multi-quality adaptive streaming preparation
- ✅ Web-optimized video conversion
- ✅ Audio extraction from videos
- ✅ Real-time encoding progress via Server-Sent Events
- ✅ Rate limiting for API protection
- ✅ File size validation (500MB max)

## Prerequisites

### Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

**Verify installation:**
```bash
ffmpeg -version
```

## Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
NODE_ENV=development
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status

### Extract Video Metadata
```
POST /api/videos/metadata
Content-Type: multipart/form-data

Body:
  video: <video file>

Response:
{
  "success": true,
  "metadata": {
    "duration": 120,
    "fileSize": 45678901,
    "resolution": "1920x1080",
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16:9",
    "fps": 30,
    "codec": "h264",
    "format": "mp4",
    "bitrate": "3000000",
    "audio": {
      "codec": "aac",
      "channels": 2,
      "sampleRate": 48000,
      "bitrate": "128000"
    }
  }
}
```

### Generate Thumbnail
```
POST /api/videos/thumbnail
Content-Type: multipart/form-data

Body:
  video: <video file>
  timestamp: "00:00:05" (optional, default: 00:00:05)

Response: JPG image file
```

### Encode Video (Single Quality)
```
POST /api/videos/encode
Content-Type: multipart/form-data

Body:
  video: <video file>
  quality: "720p" (options: 1080p, 720p, 480p, 360p)

Response: Server-Sent Events stream with progress updates
{
  "percent": "45.2",
  "timemark": "54.3",
  "currentFps": 30,
  "currentKbps": 2500
}

Final event:
{
  "complete": true,
  "filename": "encoded-1234567890-720p.mp4",
  "path": "/path/to/file"
}
```

### Encode Multiple Qualities
```
POST /api/videos/encode-multiple
Content-Type: multipart/form-data

Body:
  video: <video file>
  qualities: "1080p,720p,480p" (optional, default: all)

Response:
{
  "success": true,
  "message": "Multi-quality encoding completed",
  "results": [
    {
      "quality": "1080p",
      "path": "/path/to/video_1080p.mp4",
      "filename": "video_1080p.mp4",
      "success": true
    },
    ...
  ],
  "outputDirectory": "/path/to/batch-1234567890"
}
```

### Optimize for Web
```
POST /api/videos/optimize
Content-Type: multipart/form-data

Body:
  video: <video file>

Response:
{
  "success": true,
  "message": "Video optimized successfully",
  "filename": "optimized-1234567890.mp4",
  "path": "/path/to/file"
}
```

## Quality Presets

### 1080p (Full HD)
- Resolution: 1920x1080
- Video Bitrate: 5000k
- Audio Bitrate: 192k
- FPS: 30
- Profile: High

### 720p (HD)
- Resolution: 1280x720
- Video Bitrate: 2500k
- Audio Bitrate: 128k
- FPS: 30
- Profile: Main

### 480p (SD)
- Resolution: 854x480
- Video Bitrate: 1000k
- Audio Bitrate: 96k
- FPS: 30
- Profile: Main

### 360p (Low)
- Resolution: 640x360
- Video Bitrate: 500k
- Audio Bitrate: 96k
- FPS: 30
- Profile: Baseline

## Example Usage

### Using cURL

**Extract metadata:**
```bash
curl -X POST http://localhost:5000/api/videos/metadata \
  -F "video=@/path/to/video.mp4"
```

**Generate thumbnail:**
```bash
curl -X POST http://localhost:5000/api/videos/thumbnail \
  -F "video=@/path/to/video.mp4" \
  -F "timestamp=00:00:10" \
  --output thumbnail.jpg
```

**Encode to 720p:**
```bash
curl -X POST http://localhost:5000/api/videos/encode \
  -F "video=@/path/to/video.mp4" \
  -F "quality=720p"
```

### Using JavaScript (Frontend)

```javascript
// Extract metadata
const formData = new FormData();
formData.append('video', videoFile);

const response = await fetch('http://localhost:5000/api/videos/metadata', {
  method: 'POST',
  body: formData
});

const { metadata } = await response.json();
console.log('Video metadata:', metadata);

// Encode with progress tracking
const eventSource = new EventSource(
  'http://localhost:5000/api/videos/encode'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.complete) {
    console.log('Encoding complete!', data.filename);
    eventSource.close();
  } else if (data.error) {
    console.error('Encoding failed:', data.error);
    eventSource.close();
  } else {
    console.log(`Progress: ${data.percent}%`);
  }
};
```

## Directory Structure

```
backend/
├── server.js              # Express server setup
├── package.json           # Dependencies
├── .env                   # Environment variables
├── routes/
│   └── videoRoutes.js     # API endpoints
├── services/
│   └── ffmpegService.js   # FFmpeg operations
├── uploads/               # Temporary uploads (auto-created)
├── temp/                  # Temporary processing (auto-created)
└── encoded/               # Output files (auto-created)
```

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Upload endpoints: 10 uploads per hour per IP

## Error Handling

All endpoints return JSON error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (invalid input)
- `429` - Too many requests (rate limited)
- `500` - Server error

## Performance Tips

1. **Use appropriate quality presets** - Don't encode to higher quality than source
2. **Enable caching** - Cache encoded versions to avoid re-encoding
3. **Process asynchronously** - Use job queues for large files
4. **Clean up old files** - Set up cron jobs to delete old temporary files
5. **Monitor disk space** - Video encoding requires significant storage

## Troubleshooting

**FFmpeg not found:**
```
Error: Cannot find ffmpeg
```
Solution: Install FFmpeg and ensure it's in your system PATH

**File too large:**
```
Error: File too large
```
Solution: Increase the `fileSize` limit in `videoRoutes.js` multer configuration

**Encoding fails:**
- Check FFmpeg installation: `ffmpeg -version`
- Check input file format compatibility
- Ensure sufficient disk space
- Check server logs for detailed error messages

## Production Deployment

For production:

1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server.js --name youtube-backend
pm2 save
pm2 startup
```

3. Set up nginx as reverse proxy
4. Enable HTTPS
5. Configure firewall rules
6. Set up log rotation
7. Implement proper file cleanup routines

## License

ISC
