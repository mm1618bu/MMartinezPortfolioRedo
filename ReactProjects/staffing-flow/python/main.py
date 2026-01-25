"""Main FastAPI application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings

app = FastAPI(
    title="Staffing Flow API",
    description="Staffing Flow Python Backend API",
    version="0.1.0",
    debug=settings.is_development,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Staffing Flow Python API",
        "status": "running",
        "environment": settings.python_env,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.python_env}


@app.get("/api/staff")
async def get_staff():
    """Get staff list"""
    # Sample data - replace with actual database queries
    return [
        {"id": 1, "name": "John Doe", "role": "Developer", "status": "active"},
        {"id": 2, "name": "Jane Smith", "role": "Designer", "status": "active"},
    ]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.python_host,
        port=settings.python_port,
        reload=settings.is_development,
    )
