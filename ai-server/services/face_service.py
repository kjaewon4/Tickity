import uuid
from fastapi import UploadFile, HTTPException
from utils.io_utils import extract_embedding_from_video, extract_embedding_from_image, extract_embedding_from_video_optimized
from utils.similarity import cosine_similarity
from utils.crypto_utils import encrypt_embedding, decrypt_embedding
from config import supabase, THRESHOLD
from postgrest.exceptions import APIError
import numpy as np

def validate_uuid_or_test_id(user_id: str) -> str:
    if user_id in ['test-embedding-only', 'test-user', 'demo-user']:
        return user_id
    try:
        return str(uuid.UUID(user_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="❌ user_id가 올바른 UUID 형식이 아닙니다.")

def is_test_id(user_id: str) -> bool:
    return user_id in ['test-embedding-only', 'test-user', 'demo-user']

async def register_user_face_db(user_id: str, file: UploadFile, concert_id: str = None):
    user_id = validate_uuid_or_test_id(user_id)
    video_bytes = await file.read()
    embedding = extract_embedding_from_video_optimized(video_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴을 감지하지 못했습니다.")

    if is_test_id(user_id):
        return {
            "message": f"✅ 테스트 사용자 {user_id} 얼굴 등록 완료 (DB 저장 없음)",
            "embedding_shape": f"{len(embedding)} 차원",
            "embedding_sample": embedding[:5].tolist(),
            "test_mode": True
        }

    # ✅ 임베딩 암호화
    embedding_enc = encrypt_embedding(embedding)

    data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "embedding_enc": embedding_enc
    }

    try:
        response = supabase.table("face_embeddings").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"❌ DB 저장 실패: {e.message}")

    return {"message": f"✅ 사용자 {user_id} 얼굴 등록 완료"}
    
async def register_user_face(file: UploadFile):
    video_bytes = await file.read()
    embedding = extract_embedding_from_video(video_bytes)
    
    if embedding is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴을 감지하지 못했습니다.")
    
    return {
        "message": "✅ 얼굴 등록 완료",
        "embedding_shape": f"{len(embedding)} 차원",
        "embedding": embedding.tolist()
    }

async def verify_user_identity(user_id: str, live: UploadFile, idcard: UploadFile):
    user_id = validate_uuid_or_test_id(user_id)
    if is_test_id(user_id):
        return {
            "authenticated": True,
            "similarity_face": 0.95,
            "similarity_id": 0.92,
            "test_mode": True
        }

    response = supabase.table("face_embeddings").select("embedding_enc").eq("user_id", user_id).execute()
    if response.get("error") or not response.data:
        raise HTTPException(status_code=404, detail="❌ 등록된 사용자 없음")

    # ✅ 복호화
    db_embedding = decrypt_embedding(response.data[0]['embedding_enc'])

    live_emb = extract_embedding_from_image(await live.read())
    id_emb = extract_embedding_from_image(await idcard.read())

    if live_emb is None or id_emb is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴 인식 실패")

    sim_face = cosine_similarity(db_embedding, live_emb)
    sim_id = cosine_similarity(live_emb, id_emb)
    verified = sim_face > THRESHOLD and sim_id > THRESHOLD

    return {
        "authenticated": verified,
        "similarity_face": round(sim_face, 4),
        "similarity_id": round(sim_id, 4)
    }

def fetch_registered_embeddings():
    """
    Supabase에서 모든 user_id와 embedding을 조회하여 dict로 반환
    """
    print("🔄 Supabase에서 임베딩 로딩 중...")

    response = supabase.table("face_embeddings").select("user_id, embedding_enc").execute()
    data = response.data

    db = {}
    for item in data:
        user_id = item["user_id"]
        embedding = decrypt_embedding(item["embedding_enc"])
        db[user_id] = embedding

    print(f"✅ {len(db)}명의 embedding 로딩 완료")
    return db

async def extract_embedding(video: UploadFile):
    import cv2
    import numpy as np
    import os

    tmp_path = f"/tmp/{uuid4()}.webm"
    with open(tmp_path, "wb") as f:
        f.write(await video.read())

    cap = cv2.VideoCapture(tmp_path)
    embeddings = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # ✅ 프레임에서 embedding 추출 로직
        emb = extract_embedding_from_image(frame)
        if emb is not None:
            embeddings.append(emb)

    cap.release()
    os.remove(tmp_path)

    if embeddings:
        # ✅ 평균 embedding 계산
        return np.mean(embeddings, axis=0)
    else:
        return None

