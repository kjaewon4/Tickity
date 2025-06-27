from fastapi import UploadFile, HTTPException
from utils.io_utils import (
    extract_embedding_from_image,
    extract_embedding_from_video,
    save_embedding,
    load_embedding
)
from utils.similarity import cosine_similarity
from config import THRESHOLD

async def register_user_face(name: str, file: UploadFile):
    video_bytes = await file.read()
    embedding = extract_embedding_from_video(video_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴을 감지하지 못했습니다.")
    save_embedding(name, embedding)

async def verify_user_identity(name: str, live: UploadFile, idcard: UploadFile):
    db_embedding = load_embedding(name)
    if db_embedding is None:
        raise HTTPException(status_code=404, detail="❌ 등록된 사용자 없음")

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
