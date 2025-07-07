import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from config import REGISTERED_FACE_DIR
from sklearn.cluster import KMeans

app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0)

os.makedirs(REGISTERED_FACE_DIR, exist_ok=True)

def apply_clahe(img):
    """
    조명 보정을 위한 CLAHE 전처리
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    merged = cv2.merge((cl,a,b))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)

def extract_embedding_from_video_optimized(video_bytes, frame_skip=3, det_score_threshold=0.6, yaw_threshold=30, num_clusters=5):
    """
    등록용 영상에서 고품질 + 다양한 각도 embedding 추출 후
    KMeans 클러스터 중심으로 대표 embedding 계산
    """
    tmp_path = "./temp_video.mp4"
    with open(tmp_path, 'wb') as f:
        f.write(video_bytes)
        
        size = os.path.getsize(tmp_path)
        print(f"✅ 저장된 파일 크기: {size} bytes")

    cap = cv2.VideoCapture(tmp_path)
    if not cap.isOpened():
        print("❌ VideoCapture 열기 실패")
        os.remove(tmp_path)
        return None

    embeddings = []
    poses = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_idx += 1
        if frame_idx % frame_skip != 0:
            continue

        # ✅ 해상도 통일 + CLAHE 전처리
        resized = cv2.resize(frame, (640, 480))
        enhanced = apply_clahe(resized)
        rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
        faces = app.get(rgb)

        if faces:
            main_face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
            yaw = main_face.pose[0]
            pitch = main_face.pose[1]
            roll = main_face.pose[2]

            if main_face.det_score >= det_score_threshold and abs(yaw) <= yaw_threshold:
                embeddings.append(main_face.embedding)
                poses.append([yaw, pitch, roll])

    cap.release()
    os.remove(tmp_path)

    if not embeddings:
        print("❌ 유효한 얼굴 임베딩이 없습니다.")
        return None

    embeddings = np.array(embeddings)
    poses = np.array(poses)

    # ✅ 이상치 제거: 평균과 유사도 0.6 미만 제거
    mean_emb = np.mean(embeddings, axis=0)
    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    filtered_embeddings = [emb for emb in embeddings if cosine_similarity(emb, mean_emb) >= 0.6]
    if not filtered_embeddings:
        print("⚠️ 이상치 제거 후 남은 embedding 없음, 원본 평균 사용")
        filtered_embeddings = embeddings

    filtered_embeddings = np.array(filtered_embeddings)

    # ✅ KMeans 클러스터링으로 대표 embedding 계산
    try:
        kmeans = KMeans(n_clusters=min(num_clusters, len(filtered_embeddings)), random_state=42)
        kmeans.fit(poses)
        labels = kmeans.labels_

        cluster_embeddings = []
        for i in range(kmeans.n_clusters):
            cluster_indices = np.where(labels == i)[0]
            cluster_embs = filtered_embeddings[cluster_indices]
            cluster_mean = np.mean(cluster_embs, axis=0)
            cluster_embeddings.append(cluster_mean)

        final_embedding = np.mean(cluster_embeddings, axis=0)

    except Exception as e:
        print(f"⚠️ 클러스터링 실패, 전체 평균 사용: {e}")
        final_embedding = np.mean(filtered_embeddings, axis=0)

    print(f"✅ 최종 embedding 생성 완료 (총 {len(filtered_embeddings)}개 사용)")
    return final_embedding

def extract_embedding_from_image(image_bytes):
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    img = apply_clahe(img)

    faces = app.get(img)

    if not faces:
        return None

    # ✅ 가장 큰 얼굴 선택
    main_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))

    return main_face.embedding


def extract_embedding_from_video(video_bytes, frame_skip=3, det_score_threshold=0.6, yaw_threshold=30):
    """
    좌우 움직이는 영상에서 고품질 + 다양한 각도 embedding 평균 추출
    """
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
            # ✅ 가장 큰 얼굴 선택
            main_face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))

            # ✅ det_score + yaw filter
            yaw = main_face.pose[0]  # 좌우 회전 각도
            if main_face.det_score >= det_score_threshold and abs(yaw) <= yaw_threshold:
                embeddings.append(main_face.embedding)

    cap.release()
    os.remove(tmp_path)

    if not embeddings:
        print("❌ 유효한 얼굴 임베딩이 없습니다.")
        return None

    # ✅ 이상치 제거: 평균 embedding과 유사도 0.6 미만 제거 후 평균
    def cosine_similarity(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    mean_emb = np.mean(embeddings, axis=0)
    filtered = [emb for emb in embeddings if cosine_similarity(emb, mean_emb) >= 0.6]

    if not filtered:
        print("⚠️ 이상치 제거 후 남은 임베딩이 없습니다. 원본 평균 사용.")
        filtered = embeddings

    final_embedding = np.mean(filtered, axis=0)

    print(f"✅ 최종 {len(filtered)}개의 임베딩으로 평균 완료.")
    return final_embedding


def save_embedding(name, embedding):
    path = os.path.join(REGISTERED_FACE_DIR, f"{name}.npy")
    np.save(path, embedding)

def load_embedding(name):
    path = os.path.join(REGISTERED_FACE_DIR, f"{name}.npy")
    if not os.path.exists(path):
        return None
    return np.load(path)


