from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from config import FRONTEND_URL
from routers import face
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 환경변수에서 서버 IP 가져오기
SERVER_IP = os.getenv('SERVER_IP')
if not SERVER_IP:
    raise ValueError('SERVER_IP 환경변수가 설정되지 않았습니다.')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:8000",
        f"http://{SERVER_IP}:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Face API 라우터 등록
app.include_router(face.router, prefix="/face", tags=["Face API"])
app.mount("/static", StaticFiles(directory="static"), name="static")