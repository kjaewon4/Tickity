from fastapi import FastAPI
from routers import face
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(face.router, prefix="/face", tags=["Face API"])

