from fastapi import APIRouter, UploadFile, File, Form
from services.face_service import register_user_face_db, verify_user_identity

router = APIRouter()

@router.post("/register")
async def register_face_to_db(
    user_id: str = Form(...),
    video: UploadFile = File(...),
    concert_id: str = Form(None)  # 선택적으로 콘서트 연동 가능
):
    """
    사용자의 얼굴 임베딩을 DB에 등록하는 API
    """
    result = await register_user_face_db(user_id, video, concert_id)
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
