import uuid
from utils.io_utils import extract_embedding_from_video_kmeans
from utils.crypto_utils import encrypt_embedding, decrypt_embedding
from utils.similarity import cosine_similarity
from config import supabase, THRESHOLD
from fastapi import UploadFile
import os
import requests

def validate_uuid_or_test_id(user_id: str) -> str:
    """UUID 형식이거나 테스트 ID인지 확인"""
    try:
        # UUID 형식인지 확인
        uuid.UUID(user_id)
        return user_id
    except ValueError:
        # 테스트 ID인지 확인 (예: "user1", "user2" 등)
        if user_id.startswith("user") and user_id[4:].isdigit():
            return user_id
        else:
            raise ValueError(f"유효하지 않은 사용자 ID: {user_id}")

def fetch_registered_embeddings():
    """Supabase에서 등록된 얼굴 임베딩들을 가져오기"""
    try:
        response = supabase.table("face_embeddings").select("user_id, embedding_enc").execute()
        embeddings = {}
        
        for record in response.data:
            user_id = record['user_id']
            encrypted_embedding = record['embedding_enc']
            
            # 임베딩 복호화
            decrypted_embedding = decrypt_embedding(encrypted_embedding)
            embeddings[user_id] = decrypted_embedding
            
        print(f"✅ {len(embeddings)}개의 등록된 얼굴 임베딩을 불러왔습니다.")
        return embeddings
        
    except Exception as e:
        print(f"❌ 임베딩 로드 실패: {e}")
        return {}

async def register_user_face_db(user_id: str, video: UploadFile):
    """
    사용자 얼굴 비디오에서 embedding을 KMeans로 5개 추출 후 암호화하여 Tickity 백엔드에 저장
    """
    try:
        # ✅ UUID 형식 검증
        validated_user_id = validate_uuid_or_test_id(user_id)
        # ✅ 비디오에서 embedding 추출 (5개 대표 embedding)
        video_bytes = await video.read()
        embeddings = extract_embedding_from_video_kmeans(video_bytes)  # KMeans 적용된 새 함수
        if embeddings is None or len(embeddings) == 0:
            return {"success": False, "error": "❌ 얼굴을 감지하지 못했습니다."}
        # ✅ embedding 암호화 (5개 저장)
        encrypted_embedding = encrypt_embedding(embeddings)  # (5,512) -> bytes -> base64 str

        # --- 디버깅용 print ---
        print("[DEBUG] user_id:", validated_user_id)
        print("[DEBUG] embedding_enc type:", type(encrypted_embedding))
        if hasattr(encrypted_embedding, '__len__'):
            print("[DEBUG] embedding_enc length:", len(encrypted_embedding))
        else:
            print("[DEBUG] embedding_enc has no len")
        print("[DEBUG] embedding_enc preview:", str(encrypted_embedding)[:100])

        # embedding_enc가 bytes면 문자열로 변환
        if isinstance(encrypted_embedding, bytes):
            encrypted_embedding = encrypted_embedding.decode()

        files = {
            'user_id': (None, str(validated_user_id)),
            'embedding_enc': (None, str(encrypted_embedding))
        }
        print("[DEBUG] POST /auth/face-register files:", {k: v[1][:100] for k, v in files.items()})
        backend_url = os.getenv("TICKITY_BACKEND_URL", "http://localhost:4000")
        full_url = f"{backend_url.rstrip('/')}/auth/face-register"
        print("[DEBUG] 실제 요청 URL:", full_url)
        response = requests.post(full_url, files=files)
        try:
            return response.json()
        except Exception:
            return {"success": False, "error": f"백엔드 응답 파싱 실패: {response.text}"}

        # --- 기존 Supabase 직접 접근 코드 (비활성화) ---
        # existing = supabase.table("face_embeddings").select("id").eq("user_id", validated_user_id).execute()
        # if existing.data and len(existing.data) > 0:
        #     result = supabase.table("face_embeddings").update({
        #         "embedding_enc": encrypted_embedding
        #     }).eq("user_id", validated_user_id).execute()
        #     action = "업데이트"
        # else:
        #     result = supabase.table("face_embeddings").insert({
        #         "user_id": validated_user_id,
        #         "embedding_enc": encrypted_embedding
        #     }).execute()
        #     action = "등록"
        # if result.data:
        #     print(f"✅ 사용자 {validated_user_id} 얼굴 임베딩 {action} 성공 (총 {len(embeddings)}개 저장)")
        #     return {"success": True, "message": f"{len(embeddings)}개 embedding {action} 완료"}
        # else:
        #     print(f"❌ DB {action} 실패")
        #     return {"success": False, "error": f"DB {action} 실패"}

    except Exception as e:
        print(f"❌ 얼굴 등록 실패: {e}")
        return {"success": False, "error": f"얼굴 등록 중 오류가 발생했습니다: {str(e)}"}

async def verify_user_identity(live: UploadFile, idcard: UploadFile):
    """
    라이브 사진과 신분증 사진을 비교하여 사용자 신원을 확인 (개선된 함수 사용)
    """
    # 개선된 함수로 임베딩 추출
    live_emb = extract_embedding_from_video_optimized(await live.read())
    id_emb = extract_embedding_from_video_optimized(await idcard.read())
    
    if live_emb is None or id_emb is None:
        return {"success": False, "error": "얼굴을 감지하지 못했습니다."}
    
    # 유사도 계산
    sim_face = cosine_similarity(live_emb, id_emb)
    sim_id = cosine_similarity(live_emb, id_emb)  # 동일한 비교이지만 구조 유지
    
    # 임계값 비교
    verified = sim_face > THRESHOLD and sim_id > THRESHOLD
    
    return {
        "success": True,
        "verified": verified,
        "similarity_face": float(sim_face),
        "similarity_id": float(sim_id)
    }

async def register_user_face(user_id: str, video: UploadFile):
    """
    메모리에 사용자 얼굴 임베딩 저장 (테스트용)
    """
    try:
        # 비디오에서 임베딩 추출
        video_bytes = await video.read()
        embedding = extract_embedding_from_video_optimized(video_bytes)
        
        if embedding is None:
            return {"success": False, "error": "얼굴을 감지하지 못했습니다."}
        
        # 메모리에 저장 (간단한 딕셔너리)
        from routers.face import embedding_store
        embedding_store[user_id] = embedding
        
        print(f"✅ 사용자 {user_id} 얼굴 임베딩 메모리 저장 완료")
        return {"success": True, "message": "얼굴 등록이 완료되었습니다."}
        
    except Exception as e:
        print(f"❌ 얼굴 등록 실패: {e}")
        return {"success": False, "error": f"얼굴 등록 중 오류가 발생했습니다: {str(e)}"}

