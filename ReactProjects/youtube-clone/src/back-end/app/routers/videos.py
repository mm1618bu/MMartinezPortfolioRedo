# backend/app/routers/videos.py
from typing import List
import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Define upload directories
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads"
VIDEO_DIR = UPLOAD_DIR / "videos"
THUMBNAIL_DIR = UPLOAD_DIR / "thumbnails"

# Ensure directories exist
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)


class Video(BaseModel):
    id: str
    title: str
    description: str | None = None
    thumbnail_url: str | None = None
    video_url: str | None = None
    views: int = 0
    duration: int = 0  # seconds


fake_videos_db = [
    Video(
        id="vid_123",
        title="My First Video",
        description="Demo video",
        thumbnail_url="https://placehold.co/320x180",
        views=100,
        duration=600,
    ),
    Video(
        id="vid_456",
        title="Another Video",
        description="Second demo",
        thumbnail_url="https://placehold.co/320x180",
        views=250,
        duration=420,
    ),
]


@router.get("/", response_model=List[Video])
async def list_videos():
    """
    Simple demo endpoint: return all videos.
    Later you'll replace with real DB queries.
    """
    return fake_videos_db


@router.get("/{video_id}", response_model=Video)
async def get_video(video_id: str):
    for video in fake_videos_db:
        if video.id == video_id:
            return video
    raise HTTPException(status_code=404, detail="Video not found")


@router.post("/upload", response_model=Video)
async def upload_video(
    title: str = Form(...),
    description: str = Form(None),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(None),
):
    """
    Upload a new video with optional thumbnail.
    Accepts multipart/form-data with:
    - title: Video title (required)
    - description: Video description (optional)
    - video: Video file (required)
    - thumbnail: Thumbnail image (optional)
    """
    # Generate unique ID
    video_id = f"vid_{uuid.uuid4().hex[:8]}"
    
    # Save video file
    video_filename = f"{video_id}_{video.filename}"
    video_path = VIDEO_DIR / video_filename
    
    with video_path.open("wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    # Save thumbnail if provided
    thumbnail_filename = None
    if thumbnail:
        thumbnail_filename = f"{video_id}_{thumbnail.filename}"
        thumbnail_path = THUMBNAIL_DIR / thumbnail_filename
        
        with thumbnail_path.open("wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
    
    # Create video object
    new_video = Video(
        id=video_id,
        title=title,
        description=description,
        video_url=f"/uploads/videos/{video_filename}",
        thumbnail_url=f"/uploads/thumbnails/{thumbnail_filename}" if thumbnail_filename else "https://placehold.co/320x180",
        views=0,
        duration=0,  # You could use ffmpeg to get actual duration
    )
    
    # Add to our fake database
    fake_videos_db.append(new_video)
    
    return new_video


# Temporary storage for chunk uploads
chunk_storage = {}

@router.post("/upload-chunk")
async def upload_chunk(
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    upload_id: str = Form(...),
    chunk: UploadFile = File(...),
):
    """Upload a single chunk of a video file"""
    # Create temp directory for this upload
    temp_dir = UPLOAD_DIR / "temp" / upload_id
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    # Save chunk
    chunk_path = temp_dir / f"chunk_{chunk_index}"
    with chunk_path.open("wb") as buffer:
        shutil.copyfileobj(chunk.file, buffer)
    
    # Track progress
    if upload_id not in chunk_storage:
        chunk_storage[upload_id] = set()
    chunk_storage[upload_id].add(chunk_index)
    
    return {
        "chunk_index": chunk_index,
        "total_chunks": total_chunks,
        "received": len(chunk_storage[upload_id]),
        "complete": len(chunk_storage[upload_id]) == total_chunks
    }


@router.post("/finalize-upload", response_model=Video)
async def finalize_upload(
    upload_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    filename: str = Form(...),
    total_chunks: int = Form(...),
    thumbnail: UploadFile = File(None),
):
    """Combine all chunks into final video file"""
    temp_dir = UPLOAD_DIR / "temp" / upload_id
    
    # Verify all chunks received
    if upload_id not in chunk_storage or len(chunk_storage[upload_id]) != total_chunks:
        raise HTTPException(status_code=400, detail="Not all chunks received")
    
    # Generate video ID
    video_id = f"vid_{uuid.uuid4().hex[:8]}"
    video_filename = f"{video_id}_{filename}"
    video_path = VIDEO_DIR / video_filename
    
    # Combine chunks
    with video_path.open("wb") as outfile:
        for i in range(total_chunks):
            chunk_path = temp_dir / f"chunk_{i}"
            with chunk_path.open("rb") as infile:
                shutil.copyfileobj(infile, outfile)
    
    # Clean up temp files
    shutil.rmtree(temp_dir)
    del chunk_storage[upload_id]
    
    # Save thumbnail if provided
    thumbnail_filename = None
    if thumbnail:
        thumbnail_filename = f"{video_id}_{thumbnail.filename}"
        thumbnail_path = THUMBNAIL_DIR / thumbnail_filename
        with thumbnail_path.open("wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
    
    # Create video object
    new_video = Video(
        id=video_id,
        title=title,
        description=description,
        video_url=f"/uploads/videos/{video_filename}",
        thumbnail_url=f"/uploads/thumbnails/{thumbnail_filename}" if thumbnail_filename else "https://placehold.co/320x180",
        views=0,
        duration=0,
    )
    
    fake_videos_db.append(new_video)
    return new_video
