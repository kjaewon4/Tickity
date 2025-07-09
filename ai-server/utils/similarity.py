import numpy as np

def cosine_similarity(a, b):
    """
    코사인 유사도 계산
    """
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def compare_embeddings(a, b, threshold_cosine=0.5):
    """
    코사인 유사도만 비교하여 결과를 반환
    - threshold_cosine: 인증 성공을 위한 최소 코사인 유사도
    """
    cos_sim = cosine_similarity(a, b)
    verified = cos_sim > threshold_cosine

    return {
        "cosine_similarity": cos_sim,
        "verified": verified
    }
