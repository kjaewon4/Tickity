from fastapi import APIRouter, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from services.face_service import fetch_registered_embeddings, register_user_face_db, verify_user_identity, register_user_face
from utils.io_utils import extract_embedding_from_image
from uuid import uuid4
from utils.similarity import cosine_similarity
from config import THRESHOLD
import numpy as np
import hashlib

router = APIRouter()
embedding_store = {}
embedding_cache = {}


@router.post("/load-user-embedding")
async def load_user_embedding(target_user_id: str = Form(...)):
    """
    특정 사용자의 embedding을 DB에서 조회해 embedding_cache에 저장
    """
    from services.face_service import validate_uuid_or_test_id
    from config import supabase
    from utils.crypto_utils import decrypt_embedding

    try:
        validated_user_id = validate_uuid_or_test_id(target_user_id)
        response = supabase.table("face_embeddings").select("embedding_enc").eq("user_id", validated_user_id).execute()
        
        if not response.data:
            return {"success": False, "error": "등록된 얼굴 정보가 없습니다."}
        
        db_embedding = decrypt_embedding(response.data[0]['embedding_enc'])
        embedding_cache[validated_user_id] = db_embedding

        print(f"✅ {validated_user_id} embedding 캐시에 저장 완료")
        return {"success": True, "message": "embedding 캐시에 저장 완료"}

    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/register")
async def register_face_to_db(
    user_id: str = Form(...),  # ✅ user_id Form으로 받기
    video: UploadFile = File(...)
):
    """
    사용자 얼굴 임베딩을 추출하고 DB에 저장 (개선된 함수 사용)
    """
    result = await register_user_face_db(user_id, video)
    return result

@router.post("/verify-frame")
async def verify_frame(
    frame: UploadFile = File(...),
    target_user_id: str = Form(...)
):
    """
    특정 사용자의 얼굴 인증 - embedding_cache에 저장된 대상 사용자 ID의 embedding과 비교
    """
    frame_bytes = await frame.read()
    embedding = extract_embedding_from_image(frame_bytes)
    if embedding is None:
        return {"success": False, "verified": False, "error": "얼굴을 감지하지 못했습니다."}

    # ✅ 캐시에서 embedding 가져오기
    db_embedding = embedding_cache.get(target_user_id)
    if db_embedding is None:
        return {"success": False, "verified": False, "error": "embedding_cache에 해당 사용자의 embedding이 없습니다. /load-user-embedding 먼저 호출하세요."}

    # ✅ 유사도 계산
    if db_embedding.ndim == 2:
        scores = [cosine_similarity(embedding, emb) for emb in db_embedding]
        score = max(scores)
    else:
        score = cosine_similarity(embedding, db_embedding)

    verified = score > THRESHOLD

    print(f"🔍 얼굴 인증 결과:")
    print(f"  - 사용자 ID: {target_user_id}")
    print(f"  - 유사도 점수: {score:.4f}")
    print(f"  - 임계값: {THRESHOLD}")
    print(f"  - 인증 결과: {'성공' if verified else '실패'}")

    # ✅ 얼굴 해시 생성 (인증 성공 시)
    face_hash = None
    if verified:
        embedding_str = ','.join([f"{x:.6f}" for x in embedding.flatten()])
        face_hash = hashlib.sha256(embedding_str.encode()).hexdigest()
        face_hash = f"0x{face_hash}"
        print(f"  - 생성된 얼굴 해시: {face_hash}")

    result = {
        "success": True,
        "verified": bool(verified),
        "user_id": target_user_id if verified else "Unknown",
        "score": float(score),
        "threshold": float(THRESHOLD),
        "message": f"유사도 {score:.4f} (임계값: {THRESHOLD})"
    }

    if verified and face_hash:
        result["face_hash"] = face_hash

    return result

@router.post("/verify-general")
async def verify_general(frame: UploadFile = File(...)):
    """
    일반 얼굴 인증 - 전체 DB에서 최고 유사도 찾기 (개선된 함수 사용)
    """
    frame_bytes = await frame.read()
    # ✅ 실시간 프레임(image/jpeg) 처리에 맞게 수정
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

    # Threshold 비교는 최종에서 수행
    if best_score < THRESHOLD:
        best_match = "Unknown"

    return {
        "success": True,
        "user_id": best_match,
        "score": float(best_score)
    }
