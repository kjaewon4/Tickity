from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from services.face_service import register_user_face_db, verify_user_identity, register_user_face
from uuid import uuid4

router = APIRouter()
embedding_store = {}

@router.post("/register")
async def register_face_to_db(
    video: UploadFile = File(...)
):

    """
    사용자의 얼굴 임베딩을 추출하여 프론트로 전달하는 API
    """
    result = await register_user_face(video)
    return result

@router.post("/verify")
async def verify_face_identity(
    user_id: str = Form(...),
    live: UploadFile = File(...),
    idcard: UploadFile = File(...)
):
    """
    라이브 영상과 신분증으로 사용자 얼굴 인증 API
    """
    result = await verify_user_identity(user_id, live, idcard)
    return result

# ✅ 임베딩 임시 저장 API 라우터로 변경
@router.post("/api/embedding-temp")
async def save_embedding(req: Request):
    body = await req.json()
    embedding = body.get("embedding")
    temp_id = str(uuid4())
    embedding_store[temp_id] = embedding
    return { "temp_id": temp_id }

@router.get("/api/embedding-temp/{temp_id}")
async def get_embedding(temp_id: str):
    embedding = embedding_store.get(temp_id)
    if not embedding:
        return JSONResponse({"error": "not found"}, status_code=404)
    return {"embedding": embedding}
from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from services.face_service import register_user_face_db, verify_user_identity, register_user_face
from uuid import uuid4

router = APIRouter()
embedding_store = {}

@router.post("/register")
async def register_face_to_db(video: UploadFile = File(...)):
    """
    사용자의 얼굴 임베딩을 추출하여 프론트로 전달하는 API
    """
    result = await register_user_face(video)
    return result

@router.post("/verify")
async def verify_face_identity(
    user_id: str = Form(...),
    live: UploadFile = File(...),
    idcard: UploadFile = File(...)
):
    """
    라이브 영상과 신분증으로 사용자 얼굴 인증 API
    """
    result = await verify_user_identity(user_id, live, idcard)
    return result

# ✅ 임베딩 임시 저장 API 라우터로 변경
@router.post("/embedding-temp")
async def save_embedding(req: Request):
    body = await req.json()
    embedding = body.get("embedding")
    temp_id = str(uuid4())
    embedding_store[temp_id] = embedding
    return { "temp_id": temp_id }

@router.get("/api/embedding-temp/{temp_id}")
async def get_embedding(temp_id: str):
    embedding = embedding_store.get(temp_id)
    if not embedding:
        return JSONResponse({"error": "not found"}, status_code=404)
    return {"embedding": embedding}
