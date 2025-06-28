#!/usr/bin/env python3
"""
AI 서버 기능 테스트 스크립트
"""

import requests
import json
import os
from pathlib import Path

# AI 서버 기본 URL
AI_SERVER_URL = "http://localhost:8001"

def test_server_health():
    """서버 상태 확인"""
    try:
        response = requests.get(f"{AI_SERVER_URL}/docs")
        print("✅ 서버가 정상적으로 실행 중입니다.")
        print(f"📖 API 문서: {AI_SERVER_URL}/docs")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.")
        return False

def test_face_register(user_id, video_path):
    """얼굴 등록 테스트"""
    if not os.path.exists(video_path):
        print(f"❌ 비디오 파일을 찾을 수 없습니다: {video_path}")
        return False
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {
                'user_id': (None, user_id),
                'video': (os.path.basename(video_path), video_file, 'video/mp4')
            }
            
            response = requests.post(f"{AI_SERVER_URL}/face/register", files=files)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 얼굴 등록 성공: {result}")
                return True
            else:
                print(f"❌ 얼굴 등록 실패: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"❌ 얼굴 등록 중 오류 발생: {e}")
        return False

def test_face_verify(name, live_photo_path, id_card_path):
    """얼굴 검증 테스트"""
    if not os.path.exists(live_photo_path):
        print(f"❌ 실시간 사진을 찾을 수 없습니다: {live_photo_path}")
        return False
    
    if not os.path.exists(id_card_path):
        print(f"❌ 신분증 사진을 찾을 수 없습니다: {id_card_path}")
        return False
    
    try:
        with open(live_photo_path, 'rb') as live_file, open(id_card_path, 'rb') as id_file:
            files = {
                'name': (None, name),
                'live': (os.path.basename(live_photo_path), live_file, 'image/jpeg'),
                'idcard': (os.path.basename(id_card_path), id_file, 'image/jpeg')
            }
            
            response = requests.post(f"{AI_SERVER_URL}/face/verify", files=files)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 얼굴 검증 성공: {result}")
                return True
            else:
                print(f"❌ 얼굴 검증 실패: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"❌ 얼굴 검증 중 오류 발생: {e}")
        return False

def create_test_data():
    """테스트용 데이터 디렉토리 생성"""
    test_dir = Path("test_data")
    test_dir.mkdir(exist_ok=True)
    
    # 테스트용 더미 파일 생성 (실제로는 실제 이미지/비디오 파일이 필요)
    (test_dir / "sample_video.mp4").touch()
    (test_dir / "live_photo.jpg").touch()
    (test_dir / "id_card.jpg").touch()
    
    print(f"📁 테스트 데이터 디렉토리 생성: {test_dir}")
    return test_dir

def main():
    """메인 테스트 함수"""
    print("🤖 AI 서버 기능 테스트 시작")
    print("=" * 50)
    
    # 1. 서버 상태 확인
    if not test_server_health():
        return
    
    print("\n" + "=" * 50)
    
    # 2. 테스트 데이터 준비
    test_dir = create_test_data()
    
    # 3. 얼굴 등록 테스트
    print("\n📹 얼굴 등록 테스트")
    test_face_register("test_user_001", test_dir / "sample_video.mp4")
    
    print("\n" + "=" * 50)
    
    # 4. 얼굴 검증 테스트
    print("\n🔍 얼굴 검증 테스트")
    test_face_verify("test_user_001", test_dir / "live_photo.jpg", test_dir / "id_card.jpg")
    
    print("\n" + "=" * 50)
    print("🎉 테스트 완료!")

if __name__ == "__main__":
    main() 