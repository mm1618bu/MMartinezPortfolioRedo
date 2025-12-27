# FFmpeg Backend Integration Setup

## ✅ Installation Complete

### What Was Created

1. **Backend API Server** (`/backend`)
   - Express.js server with FFmpeg integration
   - Video encoding, transcoding, optimization endpoints
   - Server-Sent Events (SSE) for real-time progress
   - Rate limiting and security middleware

2. **Frontend Integration**
   - `videoEncodingService.js` - React client for backend API
   - `VideoEncodingDialog.jsx` - UI for quality selection
   - Backend health checking
   - Progress tracking with real-time updates

3. **System Components**
   - ✅ FFmpeg v6.1.1 installed
   - ✅ Backend dependencies installed (143 packages)
   - ✅ Environment files configured

### Backend API Endpoints

```
GET  /api/health              - Health check
POST /api/videos/metadata     - Extract metadata
POST /api/videos/thumbnail    - Generate thumbnail
POST /api/videos/encode       - Encode to single quality (with SSE)
POST /api/videos/encode-multiple - Batch encoding
POST /api/videos/optimize     - Web optimization
```

### Quality Presets

| Quality | Resolution | Bitrate | Use Case |
|---------|-----------|---------|----------|
| 1080p   | 1920x1080 | 5Mbps   | Full HD streaming |
| 720p    | 1280x720  | 2.5Mbps | HD streaming |
| 480p    | 854x480   | 1Mbps   | SD streaming |
| 360p    | 640x360   | 500Kbps | Low bandwidth |

## 🚀 Starting the Backend

### Option 1: Development Mode (with auto-reload)
```bash
cd backend
npm run dev
```

### Option 2: Production Mode
```bash
cd backend
npm start
```

The backend will start on **http://localhost:5000**

### Verify Backend is Running
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Video processing API is running",
  "endpoints": [...]
}
```

## 🎨 Using in Your Frontend

### 1. Import the Service
```javascript
import {
  encodeVideo,
  extractVideoMetadata,
  generateThumbnail,
  checkBackendHealth
} from '../services/videoEncodingService';
```

### 2. Extract Metadata
```javascript
const metadata = await extractVideoMetadata(videoFile);
console.log(metadata);
// { duration, width, height, codec, bitrate, ... }
```

### 3. Encode Video with Progress
```javascript
const result = await encodeVideo(
  videoFile,
  '720p',
  (percent, fps, speed) => {
    console.log(`${percent}% @ ${fps}fps (${speed})`);
  }
);
```

### 4. Generate Thumbnail
```javascript
const thumbnailBlob = await generateThumbnail(videoFile, 5); // at 5 seconds
const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
```

### 5. Using the Encoding Dialog
```javascript
import VideoEncodingDialog from './components/VideoEncodingDialog';

function MyUploader() {
  const [showDialog, setShowDialog] = useState(false);
  const [videoFile, setVideoFile] = useState(null);

  const handleEncodeComplete = (result) => {
    console.log('Encoding complete:', result);
    setShowDialog(false);
    // Continue with upload using encoded video
  };

  return (
    <>
      {showDialog && (
        <VideoEncodingDialog
          videoFile={videoFile}
          onComplete={handleEncodeComplete}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
```

## 🔧 Configuration

### Backend Environment Variables
File: `backend/.env`

```env
NODE_ENV=development
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://ruwkbhmdfbuapnqeajci.supabase.co
SUPABASE_ANON_KEY=sb_publishable_cd7IhMPPXUXr5jJX_84Y1g_o26vPGzV
```

### Frontend Environment Variables
File: `.env` (root)

```env
VITE_BACKEND_URL=http://localhost:5000
```

## 🛡️ Security Features

1. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Upload endpoints: 10 uploads per hour

2. **File Validation**
   - MIME type checking (video/* only)
   - 500MB file size limit
   - Automatic cleanup of temporary files

3. **CORS**
   - Configured for frontend origin (http://localhost:3000)
   - Credentials support enabled

## 📊 Monitoring & Testing

### Test Metadata Extraction
```bash
curl -X POST http://localhost:5000/api/videos/metadata \
  -F "video=@sample.mp4"
```

### Test Thumbnail Generation
```bash
curl -X POST http://localhost:5000/api/videos/thumbnail \
  -F "video=@sample.mp4" \
  -F "timestamp=5" \
  --output thumbnail.jpg
```

### Test Encoding
```bash
curl -X POST http://localhost:5000/api/videos/encode \
  -F "video=@sample.mp4" \
  -F "quality=720p"
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check FFmpeg installation
ffmpeg -version

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Port 5000 already in use
Change `BACKEND_PORT` in `backend/.env` to another port (e.g., 5001)

### CORS errors
Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL

### Encoding fails
```bash
# Check FFmpeg can access file
ffmpeg -i your-video.mp4

# Check logs
# Terminal output shows detailed FFmpeg errors
```

## 📁 File Structure

```
backend/
├── server.js              # Express server entry point
├── package.json          # Dependencies
├── .env                  # Environment config
├── routes/
│   └── videoRoutes.js    # API endpoints
└── services/
    └── ffmpegService.js  # FFmpeg operations

src/front-end/
├── services/
│   └── videoEncodingService.js  # Backend client
└── components/
    ├── VideoEncodingDialog.jsx  # Encoding UI
    └── VideoEncodingDialog.scss # Styles
```

## 🎯 Next Steps

1. **Start the backend**: `cd backend && npm run dev`
2. **Test health endpoint**: `curl http://localhost:5000/api/health`
3. **Integrate into VideoUpload.jsx**:
   - Import `VideoEncodingDialog`
   - Show dialog after video selection
   - Use encoded video for upload

## 📝 Notes

- Backend runs independently from frontend
- Videos are temporarily stored during processing
- Automatic cleanup removes temp files after completion
- SSE provides real-time encoding progress
- All endpoints return JSON (except thumbnail = JPEG)

## 🔗 Resources

- FFmpeg Documentation: https://ffmpeg.org/documentation.html
- Backend API docs: `/backend/README.md`
- Express.js: https://expressjs.com/
- Fluent-FFmpeg: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
