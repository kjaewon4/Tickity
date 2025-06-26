import os
import sys
import cv2
import numpy as np
from insightface.app import FaceAnalysis

# ✅ 현재 파일 기준으로 루트 디렉토리를 sys.path에 등록
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from utils.similarity import cosine_similarity

THRESHOLD = 0.5
SAVE_DIR = "./data/registered_faces"

# 모델 준비
app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(320, 320))

# 등록된 얼굴 임베딩 로드
def load_registered_embeddings():
    db = {}
    for file in os.listdir(SAVE_DIR):
        if file.endswith(".npy"):
            name = file.replace(".npy", "")
            vec = np.load(os.path.join(SAVE_DIR, file))
            db[name] = vec
    return db

db_embeddings = load_registered_embeddings()
if not db_embeddings:
    print("❌ 등록된 사용자가 없습니다. 먼저 얼굴을 등록하세요.")
    exit(1)

# ✅ 고정된 카메라 인덱스 사용 (video0)
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ 웹캠을 열 수 없습니다.")
    exit(1)

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

        for name, reg_emb in db_embeddings.items():
            score = cosine_similarity(live_emb, reg_emb)
            if score > best_score:
                best_score = score
                best_match = name if score > THRESHOLD else "Unknown"

        cv2.rectangle(display_frame, tuple(bbox[:2]), tuple(bbox[2:]), (0, 255, 0), 2)
        label = f"{best_match} ({best_score:.2f})"
        cv2.putText(display_frame, label, (bbox[0], bbox[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Live Face Verification", display_frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
