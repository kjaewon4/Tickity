from cryptography.fernet import Fernet
import base64
import numpy as np
import os

ENCRYPTION_KEY = os.getenv("EMBEDDING_SECRET_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("❌ EMBEDDING_SECRET_KEY 환경변수가 설정되지 않았습니다.")

fernet = Fernet(ENCRYPTION_KEY)

def encrypt_embedding(embedding: np.ndarray) -> str:
    bytes_data = embedding.astype(np.float32).tobytes()
    encrypted = fernet.encrypt(bytes_data)
    return base64.b64encode(encrypted).decode()

def decrypt_embedding(encrypted_b64: str) -> np.ndarray:
    encrypted = base64.b64decode(encrypted_b64.encode())
    decrypted = fernet.decrypt(encrypted)
    return np.frombuffer(decrypted, dtype=np.float32)
