from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import claims, hallucination
import os

load_dotenv()

app = FastAPI(
    title="Radiology Hallucination Detection AI Service",
    description="Multimodal AI pipeline for radiology report consistency and hallucination detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(claims.router)
app.include_router(hallucination.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "AI service is running",
        "model": os.getenv("AI_MODEL", "google/gemma-4-31b-it:free")
    }