import uuid
from fastapi import UploadFile, HTTPException
from utils.io_utils import extract_embedding_from_video, extract_embedding_from_image
from utils.similarity import cosine_similarity
from config import supabase, THRESHOLD
from postgrest.exceptions import APIError

async def register_user_face_db(user_id: str, file: UploadFile, concert_id: str = None):
    # ✅ UUID 형식 검증
    try:
        user_id = str(uuid.UUID(user_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="❌ user_id가 올바른 UUID 형식이 아닙니다.")

    if concert_id is not None:
        try:
            concert_id = str(uuid.UUID(concert_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="❌ concert_id가 올바른 UUID 형식이 아닙니다.")

    video_bytes = await file.read()
    embedding = extract_embedding_from_video(video_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴을 감지하지 못했습니다.")

    data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "concert_id": concert_id,
        "embedding": embedding.tolist()
    }

    try:
        response = supabase.table("face_embeddings").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"❌ DB 저장 실패: {e.message}")

    return {"message": f"✅ 사용자 {user_id} 얼굴 등록 완료"}


async def verify_user_identity(user_id: str, live: UploadFile, idcard: UploadFile):
    # DB에서 등록된 임베딩 불러오기
    response = supabase.table("face_embeddings").select("embedding").eq("user_id", user_id).execute()
    if response.get("error") or not response.data:
        raise HTTPException(status_code=404, detail="❌ 등록된 사용자 없음")

    db_embedding = response.data[0]['embedding']

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
