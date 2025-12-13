import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Video encoding configurations for different quality presets
 */
const ENCODING_PRESETS = {
  '1080p': {
    resolution: '1920x1080',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    fps: 30,
    profile: 'high',
    preset: 'medium'
  },
  '720p': {
    resolution: '1280x720',
    videoBitrate: '2500k',
    audioBitrate: '128k',
    fps: 30,
    profile: 'main',
    preset: 'medium'
  },
  '480p': {
    resolution: '854x480',
    videoBitrate: '1000k',
    audioBitrate: '96k',
    fps: 30,
    profile: 'main',
    preset: 'fast'
  },
  '360p': {
    resolution: '640x360',
    videoBitrate: '500k',
    audioBitrate: '96k',
    fps: 30,
    profile: 'baseline',
    preset: 'fast'
  }
};

/**
 * Get video metadata using FFprobe
 */
export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to extract metadata: ${err.message}`));
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      resolve({
        duration: metadata.format.duration,
        fileSize: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name,
        
        // Video details
        width: videoStream.width,
        height: videoStream.height,
        resolution: `${videoStream.width}x${videoStream.height}`,
        codec: videoStream.codec_name,
        fps: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
        aspectRatio: videoStream.display_aspect_ratio,
        pixelFormat: videoStream.pix_fmt,
        
        // Audio details (if exists)
        audioCodec: audioStream?.codec_name,
        audioChannels: audioStream?.channels,
        audioSampleRate: audioStream?.sample_rate,
        audioBitrate: audioStream?.bit_rate,
        
        // Full metadata
        fullMetadata: metadata
      });
    });
  });
};

/**
 * Generate video thumbnail at specific timestamp
 */
export const generateThumbnail = (inputPath, outputPath, timestamp = '00:00:05') => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720'
      })
      .on('end', () => {
        console.log(`✅ Thumbnail generated: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Thumbnail generation failed: ${err.message}`));
      });
  });
};

/**
 * Encode video to specific quality preset
 */
export const encodeVideo = (inputPath, outputPath, quality = '720p', onProgress) => {
  return new Promise(async (resolve, reject) => {
    const preset = ENCODING_PRESETS[quality];
    
    if (!preset) {
      reject(new Error(`Invalid quality preset: ${quality}`));
      return;
    }

    try {
      // Get input metadata to calculate progress
      const metadata = await getVideoMetadata(inputPath);
      const totalDuration = metadata.duration;

      console.log(`🎬 Encoding video to ${quality}...`);
      console.log(`📊 Input: ${metadata.resolution}, ${metadata.codec}`);
      console.log(`📊 Output: ${preset.resolution}, H.264`);

      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(preset.resolution)
        .videoBitrate(preset.videoBitrate)
        .audioBitrate(preset.audioBitrate)
        .fps(preset.fps)
        .outputOptions([
          `-preset ${preset.preset}`,
          `-profile:v ${preset.profile}`,
          '-movflags +faststart', // Enable streaming
          '-pix_fmt yuv420p' // Maximum compatibility
        ])
        .on('start', (commandLine) => {
          console.log(`⚙️ FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          const percent = (progress.timemark / totalDuration) * 100;
          console.log(`📈 Progress: ${percent.toFixed(1)}% (${progress.timemark}/${totalDuration}s)`);
          
          if (onProgress) {
            onProgress({
              percent: percent.toFixed(1),
              timemark: progress.timemark,
              currentFps: progress.currentFps,
              currentKbps: progress.currentKbps
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Encoding completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('❌ Encoding error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          reject(new Error(`Encoding failed: ${err.message}`));
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Encode video to multiple qualities (adaptive streaming)
 */
export const encodeMultipleQualities = async (inputPath, outputDir, qualities = ['720p', '480p', '360p']) => {
  const results = [];
  
  for (const quality of qualities) {
    const outputFilename = `video_${quality}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    try {
      await encodeVideo(inputPath, outputPath, quality);
      results.push({
        quality,
        path: outputPath,
        filename: outputFilename,
        success: true
      });
    } catch (error) {
      console.error(`❌ Failed to encode ${quality}:`, error.message);
      results.push({
        quality,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

/**
 * Extract audio from video
 */
export const extractAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('end', () => {
        console.log(`✅ Audio extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .run();
  });
};

/**
 * Convert video to web-optimized format
 */
export const optimizeForWeb = (inputPath, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await getVideoMetadata(inputPath);
      
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate('3000k')
        .audioBitrate('128k')
        .size('1280x?') // Maintain aspect ratio
        .outputOptions([
          '-preset fast',
          '-profile:v main',
          '-movflags +faststart',
          '-pix_fmt yuv420p'
        ])
        .on('end', () => {
          console.log(`✅ Web optimization completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error(`Web optimization failed: ${err.message}`));
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Clean up temporary files
 */
export const cleanupFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Cleaned up: ${filePath}`);
    } catch (error) {
      console.error(`Failed to delete ${filePath}:`, error.message);
    }
  }
};

export default {
  getVideoMetadata,
  generateThumbnail,
  encodeVideo,
  encodeMultipleQualities,
  extractAudio,
  optimizeForWeb,
  cleanupFiles,
  ENCODING_PRESETS
};
