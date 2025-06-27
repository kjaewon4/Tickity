import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from config import REGISTERED_FACE_DIR

app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0)

os.makedirs(REGISTERED_FACE_DIR, exist_ok=True)

def extract_embedding_from_image(image_bytes):
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    faces = app.get(img)
    if not faces:
        return None
    return faces[0].embedding

def extract_embedding_from_video(video_bytes, frame_skip=5):
    tmp_path = "./temp_video.mp4"
    with open(tmp_path, 'wb') as f:
        f.write(video_bytes)

    import os
    size = os.path.getsize(tmp_path)
    print(f"✅ 저장된 파일 크기: {size} bytes")

    cap = cv2.VideoCapture(tmp_path)
    if not cap.isOpened():
        print("❌ VideoCapture가 열리지 않았습니다.")
        os.remove(tmp_path)
        return None

    embeddings = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        if frame_idx % frame_skip != 0:
            continue
        resized = cv2.resize(frame, (640, 480))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        faces = app.get(rgb)
        if faces:
            embeddings.append(faces[0].embedding)

    cap.release()
    os.remove(tmp_path)

    if not embeddings:
        return None
    return np.mean(embeddings, axis=0)


def save_embedding(name, embedding):
    path = os.path.join(REGISTERED_FACE_DIR, f"{name}.npy")
    np.save(path, embedding)

def load_embedding(name):
    path = os.path.join(REGISTERED_FACE_DIR, f"{name}.npy")
    if not os.path.exists(path):
        return None
    return np.load(path)
