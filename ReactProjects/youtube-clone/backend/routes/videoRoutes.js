import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { 
  getVideoMetadata, 
  generateThumbnail, 
  encodeVideo,
  encodeMultipleQualities,
  optimizeForWeb,
  cleanupFiles 
} from '../services/ffmpegService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/mpeg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

/**
 * POST /api/videos/metadata
 * Extract metadata from uploaded video
 */
router.post('/metadata', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    console.log(`📹 Extracting metadata from: ${req.file.filename}`);
    
    const metadata = await getVideoMetadata(req.file.path);
    
    // Clean up uploaded file after extracting metadata
    await cleanupFiles([req.file.path]);
    
    res.json({
      success: true,
      metadata: {
        duration: Math.round(metadata.duration),
        fileSize: metadata.fileSize,
        resolution: metadata.resolution,
        width: metadata.width,
        height: metadata.height,
        aspectRatio: metadata.aspectRatio,
        fps: Math.round(metadata.fps),
        codec: metadata.codec,
        format: metadata.format,
        bitrate: metadata.bitrate,
        audio: {
          codec: metadata.audioCodec,
          channels: metadata.audioChannels,
          sampleRate: metadata.audioSampleRate,
          bitrate: metadata.audioBitrate
        }
      }
    });
  } catch (error) {
    console.error('❌ Metadata extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract video metadata',
      message: error.message 
    });
  }
});

/**
 * POST /api/videos/thumbnail
 * Generate thumbnail from uploaded video
 */
router.post('/thumbnail', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const timestamp = req.body.timestamp || '00:00:05';
    const outputDir = path.join(__dirname, '../encoded');
    const thumbnailFilename = `thumbnail-${Date.now()}.jpg`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);

    console.log(`📸 Generating thumbnail at ${timestamp}...`);
    
    await generateThumbnail(req.file.path, thumbnailPath, timestamp);
    
    // Send the thumbnail file
    res.sendFile(thumbnailPath, async (err) => {
      if (err) {
        console.error('Error sending thumbnail:', err);
      }
      // Clean up files
      await cleanupFiles([req.file.path, thumbnailPath]);
    });
  } catch (error) {
    console.error('❌ Thumbnail generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate thumbnail',
      message: error.message 
    });
  }
});

/**
 * POST /api/videos/encode
 * Encode video to specific quality
 */
router.post('/encode', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const quality = req.body.quality || '720p';
    const outputDir = path.join(__dirname, '../encoded');
    const outputFilename = `encoded-${Date.now()}-${quality}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`🎬 Encoding video to ${quality}...`);

    // Set up Server-Sent Events for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await encodeVideo(req.file.path, outputPath, quality, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      complete: true, 
      filename: outputFilename,
      path: outputPath 
    })}\n\n`);
    res.end();

    // Clean up original file
    await cleanupFiles([req.file.path]);
  } catch (error) {
    console.error('❌ Video encoding error:', error);
    res.write(`data: ${JSON.stringify({ 
      error: error.message 
    })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/videos/encode-multiple
 * Encode video to multiple qualities
 */
router.post('/encode-multiple', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const qualities = req.body.qualities 
      ? req.body.qualities.split(',') 
      : ['1080p', '720p', '480p', '360p'];
    
    const outputDir = path.join(__dirname, '../encoded', `batch-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`🎬 Encoding video to multiple qualities: ${qualities.join(', ')}`);

    const results = await encodeMultipleQualities(req.file.path, outputDir, qualities);

    res.json({
      success: true,
      message: 'Multi-quality encoding completed',
      results,
      outputDirectory: outputDir
    });

    // Clean up original file
    await cleanupFiles([req.file.path]);
  } catch (error) {
    console.error('❌ Multi-quality encoding error:', error);
    res.status(500).json({ 
      error: 'Failed to encode video',
      message: error.message 
    });
  }
});

/**
 * POST /api/videos/optimize
 * Optimize video for web playback
 */
router.post('/optimize', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const outputDir = path.join(__dirname, '../encoded');
    const outputFilename = `optimized-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`⚡ Optimizing video for web...`);

    await optimizeForWeb(req.file.path, outputPath);

    res.json({
      success: true,
      message: 'Video optimized successfully',
      filename: outputFilename,
      path: outputPath
    });

    // Clean up original file
    await cleanupFiles([req.file.path]);
  } catch (error) {
    console.error('❌ Video optimization error:', error);
    res.status(500).json({ 
      error: 'Failed to optimize video',
      message: error.message 
    });
  }
});

/**
 * GET /api/videos/test
 * Test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Video routes are working',
    endpoints: [
      'POST /api/videos/metadata - Extract video metadata',
      'POST /api/videos/thumbnail - Generate thumbnail',
      'POST /api/videos/encode - Encode to single quality',
      'POST /api/videos/encode-multiple - Encode to multiple qualities',
      'POST /api/videos/optimize - Optimize for web'
    ]
  });
});

export default router;
