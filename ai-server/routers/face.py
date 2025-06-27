from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.face_service import register_user_face, verify_user_identity

router = APIRouter()

@router.post("/register")
async def register_face_to_db(
    user_id: str = Form(...),
    video: UploadFile = File(...),
    concert_id: str = Form(None)  # 선택적으로 콘서트 연동 가능
):
    video_bytes = await video.read()
    embedding = extract_embedding_from_video(video_bytes)
    if embedding is None:
        raise HTTPException(status_code=400, detail="❌ 얼굴을 감지하지 못했습니다.")

    insert_face_embedding(user_id, embedding.tolist(), concert_id)
    return {"message": f"✅ 사용자 {user_id} 얼굴 등록 완료"}
