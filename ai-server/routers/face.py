from fastapi import APIRouter, UploadFile, File, Form
from services.face_service import register_user_face_db, verify_user_identity
from services.face_service import register_user_face

router = APIRouter()

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
