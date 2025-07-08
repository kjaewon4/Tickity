from cryptography.fernet import Fernet
import base64
import numpy as np
import os

ENCRYPTION_KEY = os.getenv("EMBEDDING_SECRET_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("❌ EMBEDDING_SECRET_KEY 환경변수가 설정되지 않았습니다.")

fernet = Fernet(ENCRYPTION_KEY)

def encrypt_embedding(embeddings: np.ndarray) -> str:
    embeddings = np.array(embeddings, dtype=np.float32)
    
    # 항상 2D shape 저장
    if embeddings.ndim == 1:
        embeddings = embeddings.reshape(1, -1)

    shape = np.array(embeddings.shape, dtype=np.int32)
    shape_bytes = shape.tobytes()
    data_bytes = embeddings.tobytes()
    combined = shape_bytes + data_bytes

    encrypted = fernet.encrypt(combined)
    return base64.b64encode(encrypted).decode()

def decrypt_embedding(encrypted_b64: str) -> np.ndarray:
    encrypted = base64.b64decode(encrypted_b64.encode())
    decrypted = fernet.decrypt(encrypted)

    shape = np.frombuffer(decrypted[:8], dtype=np.int32)
    print(f"🔍 복호화된 shape 정보: {shape}")

    data = decrypted[8:]
    embeddings = np.frombuffer(data, dtype=np.float32)

    print(f"🔍 복호화된 embedding 길이: {len(embeddings)}")

    try:
        embeddings = embeddings.reshape(shape)
    except Exception as e:
        print(f"❌ reshape 실패: {e}, shape={shape}, data_len={len(embeddings)}")
        raise e

    if embeddings.shape[0] == 1:
        embeddings = embeddings[0]
    return embeddings
