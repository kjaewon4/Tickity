import os
import sys
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from config import supabase, THRESHOLD

# ✅ 현재 파일 기준으로 루트 디렉토리를 sys.path에 등록
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from utils.similarity import cosine_similarity
from utils.crypto_utils import decrypt_embedding

# ✅ 모델 준비
app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(320, 320))

from postgrest.exceptions import APIError

def fetch_registered_embeddings():
    """
    Supabase에서 모든 user_id와 암호화된 embedding을 조회하여 복호화 후 dict로 반환
    """
    print("🔄 Supabase에서 암호화된 임베딩 로딩 중...")

    try:
        response = supabase.table("face_embeddings").select("user_id, embedding_enc").execute()
        data = response.data
    except APIError as e:
        print("❌ Supabase 조회 실패:", e.message)
        return {}

    db = {}
    for item in data:
        user_id = item["user_id"]
        encrypted_embedding = item["embedding_enc"]
        
        try:
            # 임베딩 복호화
            decrypted_embedding = decrypt_embedding(encrypted_embedding)
            db[user_id] = decrypted_embedding
        except Exception as e:
            print(f"⚠️ 사용자 {user_id}의 임베딩 복호화 실패: {e}")
            continue

    print(f"✅ {len(db)}명의 암호화된 임베딩 로딩 완료")
    return db


def main():
    db_embeddings = fetch_registered_embeddings()
    if not db_embeddings:
        print("❌ 등록된 사용자가 없습니다. 먼저 얼굴을 등록하세요.")
        return

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ 웹캠을 열 수 없습니다.")
        return

    print("🎥 실시간 얼굴 인증 시작 (ESC: 종료)")

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

            best_match = "Unknown"
            best_score = -1

            # ✅ DB embedding과 유사도 비교 (복호화된 임베딩 사용)
            for user_id, reg_emb in db_embeddings.items():
                score = cosine_similarity(live_emb, reg_emb)
                if score > best_score:
                    best_score = score
                    best_match = user_id if score > THRESHOLD else "Unknown"

            # ✅ 결과 화면에 표시
            cv2.rectangle(display_frame, tuple(bbox[:2]), tuple(bbox[2:]), (0, 255, 0), 2)
            label = f"{best_match} ({best_score:.2f})"
            cv2.putText(display_frame, label, (bbox[0], bbox[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        cv2.imshow("Live Face Verification", display_frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
