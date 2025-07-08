import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import io

# InsightFace 모델 로드 (전역 변수로 한 번만 로드)
try:
    app = FaceAnalysis(name="buffalo_l", providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=0)
    print("✅ InsightFace 모델 로드 완료")
except Exception as e:
    print(f"❌ InsightFace 모델 로드 실패: {e}")
    app = None

def apply_gamma(image, gamma=1.2):
    invGamma = 1.0 / gamma
    table = np.array([(i / 255.0) ** invGamma * 255
                      for i in np.arange(256)]).astype("uint8")
    return cv2.LUT(image, table)

def apply_clahe(image, clip_limit=2.0, tile_grid_size=(8, 8)):
    """
    CLAHE를 적용하여 조명을 보정합니다.
    여성 얼굴의 경우 화장이나 조명으로 인한 대비 문제를 해결하기 위해 개선된 전처리를 적용합니다.
    """
    # 1. 기본 CLAHE 적용
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l = clahe.apply(l)
    
    # 2. 여성 얼굴을 위한 추가 밝기 조정
    # 너무 어두운 부분을 약간 밝게 조정
    l = cv2.addWeighted(l, 0.9, cv2.GaussianBlur(l, (0, 0), 10), 0.1, 0)
    
    lab = cv2.merge([l, a, b])
    enhanced_image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    # 3. 가벼운 가우시안 블러로 노이즈 제거 (화장이나 반사 때문에 생기는 노이즈)
    enhanced_image = cv2.GaussianBlur(enhanced_image, (1, 1), 0)
    
    return enhanced_image


def extract_embedding_from_image(image_bytes):
    """
    단일 이미지에서 얼굴 임베딩을 추출 (det_score 필터링, gamma correction 추가)
    """
    if app is None:
        print("❌ InsightFace 모델이 로드되지 않았습니다.")
        return None

    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        print("❌ 이미지를 디코딩하지 못했습니다.")
        return None

    # CLAHE 전처리 적용
    img = apply_clahe(img)

    # 추가: gamma correction 적용
    img = apply_gamma(img, gamma=1.2)

    faces = app.get(img)

    if not faces:
        print("❌ 얼굴을 감지하지 못했습니다.")
        return None

    if len(faces) > 1:
        print(f"⚠️ 여러 얼굴 감지됨: {len(faces)}개. 가장 큰 얼굴만 사용.")

    # 가장 큰 얼굴 선택
    main_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))

    # det_score 필터링
    if main_face.det_score < 0.3:
        print(f"❌ 얼굴 det_score 낮음: {main_face.det_score:.3f}")
        return None

    return main_face.embedding

def extract_embedding_from_video_kmeans(video_bytes, frame_skip=3, det_score_threshold=0.6, num_clusters=5):
    tmp_path = "./temp_video.mp4"
    with open(tmp_path, 'wb') as f:
        f.write(video_bytes)

    cap = cv2.VideoCapture(tmp_path)
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
        enhanced = apply_clahe(resized)
        rgb = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
        faces = app.get(rgb)

        if faces:
            main_face = max(faces, key=lambda x: (x.bbox[2]-x.bbox[0])*(x.bbox[3]-x.bbox[1]))
            if main_face.det_score >= det_score_threshold:
                embeddings.append(main_face.embedding)

    cap.release()
    os.remove(tmp_path)

    if not embeddings:
        print("❌ 유효한 embedding 없음")
        return None

    embeddings = np.array(embeddings)
    print(f"✅ 총 {len(embeddings)}개 embedding 추출 완료")

    # ✅ KMeans 클러스터링으로 대표 embedding 5개 선택
    try:
        kmeans = KMeans(n_clusters=min(num_clusters, len(embeddings)), random_state=42)
        labels = kmeans.fit_predict(embeddings)

        cluster_embeddings = []
        for i in range(kmeans.n_clusters):
            cluster_indices = np.where(labels == i)[0]
            cluster_embs = embeddings[cluster_indices]
            center = kmeans.cluster_centers_[i]
            distances = np.linalg.norm(cluster_embs - center, axis=1)
            best_idx = np.argmin(distances)
            cluster_embeddings.append(cluster_embs[best_idx])

        final_embeddings = np.array(cluster_embeddings)
        print(f"🎯 KMeans로 {len(final_embeddings)}개 대표 embedding 선별")
        return final_embeddings

    except Exception as e:
        print(f"⚠️ KMeans 실패, 전체 평균 embedding 사용: {e}")
        mean_emb = np.mean(embeddings, axis=0).reshape(1, -1)
        return mean_emb
