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

def apply_clahe(image, clip_limit=2.0, tile_grid_size=(8, 8)):
    """CLAHE를 적용하여 조명을 보정합니다."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

def extract_embedding_from_video_optimized(video_bytes, frame_skip=2, det_score_threshold=0.2, yaw_threshold=60, num_clusters=5):
    """
    비디오에서 얼굴 임베딩을 추출하는 개선된 함수
    - KMeans 클러스터링으로 다양한 각도의 얼굴 선별
    - CLAHE 전처리로 조명 보정
    - 이상치 제거로 품질 향상
    """
    if app is None:
        print("❌ InsightFace 모델이 로드되지 않았습니다.")
        return None

    # 비디오 바이트를 메모리 버퍼로 변환
    video_buffer = io.BytesIO(video_bytes)
    
    # OpenCV로 비디오 읽기 (임시 파일 사용)
    import tempfile
    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
        temp_path = temp_file.name
        temp_file.write(video_bytes)
    
    cap = cv2.VideoCapture(temp_path)
    if not cap.isOpened():
        print("❌ 비디오를 열 수 없습니다.")
        # 임시 파일 정리
        try:
            os.unlink(temp_path)
        except:
            pass
        return None

    embeddings = []
    poses = []  # 얼굴 포즈 정보 저장
    frame_count = 0

    print(f"🎬 비디오 분석 시작 (frame_skip={frame_skip}, threshold={det_score_threshold})")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 프레임 스킵
        if frame_count % frame_skip != 0:
            frame_count += 1
            continue

        # CLAHE 전처리 적용
        frame = apply_clahe(frame)
        
        # 얼굴 감지
        faces = app.get(frame)
        
        if faces:
            # 가장 큰 얼굴 선택
            main_face = max(faces, key=lambda x: x.bbox[2] * x.bbox[3])
            
            # 얼굴 각도 계산 (yaw, pitch, roll)
            yaw = np.degrees(main_face.pose[1]) if hasattr(main_face, 'pose') else 0
            
            # 디버깅: 모든 얼굴 감지 결과 로그
            print(f"🔍 프레임 {frame_count}: 얼굴 감지됨 - det_score={main_face.det_score:.3f}, yaw={yaw:.1f}°")
            
            # 품질 기준 확인
            if main_face.det_score >= det_score_threshold and abs(yaw) <= yaw_threshold:
                embeddings.append(main_face.embedding)
                poses.append(abs(yaw))  # 절댓값으로 저장
                print(f"✅ 프레임 {frame_count}: 기준 통과!")
            else:
                print(f"❌ 프레임 {frame_count}: 기준 미달 (det_threshold={det_score_threshold}, yaw_threshold={yaw_threshold})")
        else:
            print(f"👻 프레임 {frame_count}: 얼굴 감지 안됨")

        frame_count += 1

    cap.release()
    
    # 임시 파일 정리
    try:
        os.unlink(temp_path)
    except:
        pass
    
    if not embeddings:
        print("❌ 첫 번째 시도 실패. 더 관대한 설정으로 재시도...")
        
        # 두 번째 시도: 더 관대한 설정
        cap = cv2.VideoCapture(temp_path)
        frame_count = 0
        fallback_embeddings = []
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # 모든 프레임 분석 (프레임 스킵 없음)
            frame = apply_clahe(frame, clip_limit=3.0, tile_grid_size=(4, 4))  # 더 강한 CLAHE
            faces = app.get(frame)
            
            if faces:
                main_face = max(faces, key=lambda x: x.bbox[2] * x.bbox[3])
                # 매우 관대한 기준 (임계값 0.1, 각도 제한 없음)
                if main_face.det_score >= 0.1:
                    fallback_embeddings.append(main_face.embedding)
                    print(f"🔄 Fallback 프레임 {frame_count}: det_score={main_face.det_score:.3f}")

            frame_count += 1

        cap.release()
        
        if fallback_embeddings:
            embeddings = np.array(fallback_embeddings)
            print(f"✅ Fallback으로 {len(embeddings)}개 임베딩 수집")
        else:
            print("❌ Fallback에서도 얼굴을 찾을 수 없습니다.")
            return None

    embeddings = np.array(embeddings)
    print(f"📊 총 {len(embeddings)}개의 임베딩 수집됨")

    # KMeans 클러스터링으로 다양한 각도 대표 선별
    if len(embeddings) > num_clusters:
        try:
            kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(embeddings)
            
            # 각 클러스터에서 중심에 가장 가까운 임베딩 선택
            selected_embeddings = []
            for i in range(num_clusters):
                cluster_embeddings = embeddings[cluster_labels == i]
                if len(cluster_embeddings) > 0:
                    # 클러스터 중심에 가장 가까운 임베딩 선택
                    center = kmeans.cluster_centers_[i]
                    distances = np.linalg.norm(cluster_embeddings - center, axis=1)
                    best_idx = np.argmin(distances)
                    selected_embeddings.append(cluster_embeddings[best_idx])
            
            embeddings = np.array(selected_embeddings)
            print(f"🎯 KMeans로 {len(embeddings)}개 대표 임베딩 선별")
            
        except Exception as e:
            print(f"⚠️ KMeans 실패, 원본 사용: {e}")

    # 이상치 제거 (IQR 방식)
    if len(embeddings) > 3:
        # 각 임베딩의 품질을 다른 임베딩들과의 유사도로 측정
        similarities = []
        for i, emb in enumerate(embeddings):
            other_embs = np.delete(embeddings, i, axis=0)
            sim_scores = np.dot(emb, other_embs.T)  # 코사인 유사도
            similarities.append(np.mean(sim_scores))
        
        similarities = np.array(similarities)
        q1, q3 = np.percentile(similarities, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        # 이상치가 아닌 임베딩만 선택
        valid_indices = np.where((similarities >= lower_bound) & (similarities <= upper_bound))[0]
        if len(valid_indices) > 0:
            embeddings = embeddings[valid_indices]
            print(f"🔍 이상치 제거 후 {len(embeddings)}개 임베딩 유지")

    # 최종 임베딩 계산 (가중 평균)
    if len(embeddings) > 1:
        # 품질 가중치 계산 (다른 임베딩들과의 유사도 기반)
        weights = []
        for emb in embeddings:
            others = embeddings[embeddings != emb].reshape(-1, embeddings.shape[1])
            if len(others) > 0:
                similarities = np.dot(emb, others.T)
                weight = np.mean(similarities)
            else:
                weight = 1.0
            weights.append(weight)
        
        weights = np.array(weights)
        weights = weights / np.sum(weights)  # 정규화
        
        # 가중 평균으로 최종 임베딩 계산
        final_embedding = np.average(embeddings, axis=0, weights=weights)
        print(f"🎯 가중 평균으로 최종 임베딩 생성 (품질 점수: {np.mean(weights):.3f})")
    else:
        final_embedding = embeddings[0]
        print("📍 단일 임베딩 사용")

    return final_embedding


