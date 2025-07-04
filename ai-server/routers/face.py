from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from services.face_service import fetch_registered_embeddings, extract_embedding_from_image, register_user_face_db, verify_user_identity, register_user_face
from uuid import uuid4
from utils.similarity import cosine_similarity
from config import THRESHOLD

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

@router.post("/verify-frame")
async def verify_frame(frame: UploadFile = File(...)):
    frame_bytes = await frame.read()
    embedding = extract_embedding_from_image(frame_bytes)
    if embedding is None:
        return {"success": False, "user_id": "Unknown", "score": 0.0}

    db_embeddings = fetch_registered_embeddings()
    best_match = "Unknown"
    best_score = -1

    for user_id, reg_emb in db_embeddings.items():
        score = cosine_similarity(embedding, reg_emb)
        if score > best_score:
            best_score = score
            best_match = user_id

    # ✅ Threshold 비교는 최종에서 수행
    if best_score < THRESHOLD:
        best_match = "Unknown"

    return {
        "success": True,
        "user_id": best_match,
        "score": float(best_score)
    }
