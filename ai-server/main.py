from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import FRONTEND_URL
from routers import face

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 정적 파일 서빙 설정
app.mount("/static", StaticFiles(directory="static"), name="static")

# Face API 라우터 등록
app.include_router(face.router, prefix="/face", tags=["Face API"])