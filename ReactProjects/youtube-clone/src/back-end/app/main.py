# backend/app/main.py
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import videos

app = FastAPI(title="YouTube Clone API")

# Mount static files for serving uploaded videos and thumbnails
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Configure CORS to allow Codespaces and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 👈 dev mode: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api/videos", tags=["videos"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "YouTube clone backend running"}
