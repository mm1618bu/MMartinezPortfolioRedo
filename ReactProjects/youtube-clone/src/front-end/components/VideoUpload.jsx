import { useState } from "react";
import { uploadVideoToSupabase, uploadThumbnailToSupabase, saveVideoMetadata } from '../utils/supabase';

export default function VideoUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [channelName, setChannelName] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !videoFile) {
      setMessage("Please provide a title and video file");
      console.warn("❌ Validation failed: Missing title or video file");
      return;
    }

    setUploading(true);
    setMessage("");
    setUploadProgress(0);
    
    console.log("📤 Starting upload...");
    console.log("Video file:", videoFile.name, `(${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
    if (thumbnailFile) {
      console.log("Thumbnail file:", thumbnailFile.name, `(${(thumbnailFile.size / 1024).toFixed(2)} KB)`);
    }

    try {
      // Use proxy URL for upload
      console.log(`📦 Uploading file (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);
      await uploadSingleFile();

      console.log("✅ Upload successful!");
      setMessage(`✅ Video uploaded successfully!`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setKeywords("");
      setChannelName("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoDuration(0);
      setUploadProgress(0);
      // Reset file inputs
      document.getElementById("videoInput").value = "";
      document.getElementById("thumbnailInput").value = "";
      
    } catch (error) {
      console.error("❌ Upload error:", error);
      setMessage(`❌ Error: ${error.message}`);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      console.log("🏁 Upload process finished");
    }
  };

  const uploadSingleFile = async () => {
    console.log(`🚀 Starting upload to Supabase`);
    const startTime = Date.now();
    
    const videoId = `vid_${Date.now()}`;
    
    // Upload video file to Supabase Storage
    setUploadProgress(10);
    console.log("📤 Uploading video file...");
    const videoUrl = await uploadVideoToSupabase(videoFile, videoId);
    
    setUploadProgress(50);
    let thumbnailUrl = null;
    if (thumbnailFile) {
      console.log("📤 Uploading thumbnail...");
      thumbnailUrl = await uploadThumbnailToSupabase(thumbnailFile, videoId);
    }
    
    setUploadProgress(80);
    
    // Save video metadata to Supabase database
    const videoData = {
      id: videoId,
      title: title,
      description: description || "",
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      channel_name: channelName || "My Channel",
      thumbnail_url: thumbnailUrl || "https://placehold.co/320x180",
      video_url: videoUrl,
      views: 0,
      likes: 0,
      dislikes: 0,
      duration: videoDuration,
      created_at: new Date().toISOString(),
    };
    
    console.log("💾 Saving metadata to database...");
    const savedVideo = await saveVideoMetadata(videoData);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Upload completed in ${elapsed}s`);
    console.log("✅ Video uploaded to Supabase");
    
    setUploadProgress(100);
    return savedVideo;
  };

  const uploadInChunks = async () => {
    const CHUNK_SIZE = 512 * 1024; // 512KB chunks for faster uploads through proxy
    const fileSize = videoFile.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📦 Uploading in ${totalChunks} chunks (${CHUNK_SIZE / 1024}KB each)`);
    console.log(`Upload ID: ${uploadId}`);

    // Upload each chunk to the server with retry logic
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = videoFile.slice(start, end);
      
      console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024).toFixed(2)} KB)`);
      
      // Retry logic for this chunk
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          const formData = new FormData();
          formData.append("chunk_index", chunkIndex);
          formData.append("total_chunks", totalChunks);
          formData.append("upload_id", uploadId);
          formData.append("chunk", chunk, `chunk_${chunkIndex}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch("/api/videos/upload-chunk", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded`, result);
          success = true;
          
        } catch (error) {
          retries--;
          console.warn(`⚠️ Chunk ${chunkIndex + 1} failed (${3 - retries}/3): ${error.message}`);
          
          if (retries === 0) {
            throw new Error(`Chunk ${chunkIndex + 1} upload failed after 3 attempts: ${error.message}`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update progress (80% for chunks, 20% for finalization)
      const progress = ((chunkIndex + 1) / totalChunks) * 80;
      setUploadProgress(progress);
    }

    console.log("🔨 All chunks uploaded, finalizing...");
    setUploadProgress(85);

    // Finalize the upload
    const finalFormData = new FormData();
    finalFormData.append("upload_id", uploadId);
    finalFormData.append("title", title);
    finalFormData.append("description", description);
    finalFormData.append("filename", videoFile.name);
    finalFormData.append("total_chunks", totalChunks);
    if (thumbnailFile) {
      finalFormData.append("thumbnail", thumbnailFile);
    }

    console.log("📤 Sending finalization request...");
    const finalResponse = await fetch("/api/videos/finalize-upload", {
      method: "POST",
      body: finalFormData,
    });

    if (!finalResponse.ok) {
      throw new Error(`Finalization failed: ${finalResponse.status} ${finalResponse.statusText}`);
    }

    setUploadProgress(100);
    const result = await finalResponse.json();
    console.log("✅ Upload finalized:", result);
    return result;
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Upload Video</h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label htmlFor="title" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter video title"
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter video description (optional)"
          />
        </div>

        <div>
          <label htmlFor="keywords" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Keywords/Tags
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="gaming, tutorial, vlog, etc. (comma separated)"
          />
        </div>

        <div>
          <label htmlFor="channelName" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Channel Name
          </label>
          <input
            type="text"
            id="channelName"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            style={{ width: "100%", padding: "8px", fontSize: "16px" }}
            placeholder="Enter your channel name (optional)"
          />
        </div>

        <div>
          <label htmlFor="videoInput" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Video File *
          </label>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setVideoFile(file);
                // Extract video duration
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                  window.URL.revokeObjectURL(video.src);
                  setVideoDuration(Math.round(video.duration));
                };
                video.src = URL.createObjectURL(file);
              }
            }}
            required
            style={{ width: "100%", padding: "8px" }}
          />
          {videoFile && (
            <p style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}>
              Selected: {videoFile.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="thumbnailInput" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Thumbnail Image
          </label>
          <input
            id="thumbnailInput"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
            style={{ width: "100%", padding: "8px" }}
          />
          {thumbnailFile && (
            <p style={{ marginTop: "5px", fontSize: "14px", color: "#666" }}>
              Selected: {thumbnailFile.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: uploading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? `Uploading... ${uploadProgress.toFixed(0)}%` : "Upload Video"}
        </button>
      </form>

      {uploading && uploadProgress > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>Upload Progress</span>
            <span style={{ fontSize: "14px" }}>{uploadProgress.toFixed(1)}%</span>
          </div>
          <div style={{
            width: "100%",
            height: "20px",
            backgroundColor: "#e0e0e0",
            borderRadius: "10px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: "100%",
              backgroundColor: "#007bff",
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
            border: `1px solid ${message.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`,
            borderRadius: "4px",
            color: message.includes("✅") ? "#155724" : "#721c24",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
