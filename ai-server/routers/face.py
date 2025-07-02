from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from services.face_service import register_user_face_db, verify_user_identity, register_user_face
from uuid import uuid4

router = APIRouter()
embedding_store = {}

@router.post("/register")
async def register_face_to_db(
    user_id: str = Form(...),  # ✅ user_id Form으로 받기
    video: UploadFile = File(...)
):
    """
    사용자 얼굴 임베딩을 추출하고 DB에 저장
    """
    result = await register_user_face_db(user_id, video)
    return result


@router.post("/face/register")
async def register_face_to_db(user_id: str = Form(...), video: UploadFile = File(...)):
    # ✅ 얼굴 embedding 추출 로직 (생략)
    embedding = await extract_embedding(video)  # 예시 함수

    if embedding is None:
        return {"success": False, "error": "임베딩 추출 실패"}

    # ✅ DB 저장
    data, error = supabase.table("face_embeddings").insert({
        "user_id": user_id,
        "embedding": embedding.tolist()
    }).execute()

    if error:
        return {"success": False, "error": str(error)}

    return {"success": True, "message": "얼굴 등록 및 embedding 저장 완료"}