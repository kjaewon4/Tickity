import os
import sys
import cv2
import numpy as np
from insightface.app import FaceAnalysis

# ✅ 현재 파일 기준으로 루트 디렉토리를 sys.path에 등록
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from config import supabase
from utils.crypto_utils import decrypt_embedding
from utils.similarity import cosine_similarity, l2_distance

# 🔧 Threshold 설정
THRESHOLD = 0.5
L2_THRESHOLD = 1.2

# ✅ 모델 준비
app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(320, 320))

# ✅ 특정 user_id만 테스트
TARGET_USER_ID = "c2440e95-0434-413a-8577-ed3b81b1b7d4"  # 🔴 테스트할 user_id로 수정

def load_registered_embeddings():
    print("🔄 Supabase에서 등록된 embedding 로딩 중...")
    try:
        response = supabase.table("face_embeddings").select("user_id, embedding_enc").execute()
        embeddings = {}
        for record in response.data:
            user_id = record['user_id'].strip()  # 혹시 모를 공백 제거
            embedding_enc = record['embedding_enc']
            emb = decrypt_embedding(embedding_enc)  # (5,512) or (512,)
            embeddings[user_id] = emb
        print(f"✅ {len(embeddings)}명의 임베딩 로드 완료")
        return embeddings
    except Exception as e:
        print(f"❌ Supabase 조회 실패: {e}")
        return {}

# ✅ 등록된 embedding 로드
db_embeddings = load_registered_embeddings()
print("🔎 등록된 user_ids:", list(db_embeddings.keys()))  # 디버깅용

if TARGET_USER_ID not in db_embeddings:
    print(f"❌ {TARGET_USER_ID} 사용자가 등록되어 있지 않습니다.")
    exit(1)

target_embedding = db_embeddings[TARGET_USER_ID]

# ✅ 카메라 초기화
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ 웹캠을 열 수 없습니다.")
    exit(1)

print(f"🎥 실시간 얼굴 인증 시작 (ESC: 종료) - 대상 사용자: {TARGET_USER_ID}")

while True:
    ret, frame = cap.read()
    if not ret:
        print("⚠️ 프레임을 읽을 수 없습니다.")
        break

    faces = app.get(frame)
    display_frame = frame.copy()

    for face in faces:
        bbox = face.bbox.astype(int)
        live_emb = face.embedding

        # ✅ 다중 embedding 비교
        if target_embedding.ndim == 2:
            scores = [cosine_similarity(live_emb, emb) for emb in target_embedding]
            distances = [l2_distance(live_emb, emb) for emb in target_embedding]
            score = max(scores)
            distance = distances[np.argmax(scores)]
        else:
            score = cosine_similarity(live_emb, target_embedding)
            distance = l2_distance(live_emb, target_embedding)

        verified = score > THRESHOLD and distance < L2_THRESHOLD

        label = f"{'✅' if verified else '❌'} {TARGET_USER_ID} ({score:.2f}, L2:{distance:.2f})"

        cv2.rectangle(display_frame, tuple(bbox[:2]), tuple(bbox[2:]), (0, 255, 0), 2)
        cv2.putText(display_frame, label, (bbox[0], bbox[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Live Face Verification", display_frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
