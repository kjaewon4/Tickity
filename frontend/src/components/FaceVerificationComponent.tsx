'use client';

import React, { useState, useRef, useEffect } from 'react';

interface FaceVerificationComponentProps {
  targetUserId: string;
  onSuccess: (faceHash?: string) => void;
  onCancel: () => void;
}

const FaceVerificationComponent: React.FC<FaceVerificationComponentProps> = ({
  targetUserId,
  onSuccess,
  onCancel
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 디버그 정보 추가
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // embedding preload
  const loadUserEmbedding = async () => {
    try {
      const formData = new FormData();
      formData.append('target_user_id', targetUserId);

      const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';
      addDebugInfo(`embedding preload 시작`);

      const res = await fetch(`${aiServerUrl}/face/load-user-embedding`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      addDebugInfo(`embedding preload 결과: ${JSON.stringify(data)}`);

      if (!data.success) {
        throw new Error(data.error || 'embedding preload 실패');
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      addDebugInfo(`❌ embedding preload 실패: ${errorMsg}`);
      setError(`embedding preload 실패: ${errorMsg}`);
      setShowError(true);
      return false;
    }
  };

  // 카메라 시작
  const startCamera = async () => {
    try {
      console.log('🔍 카메라 시작 시도...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          (async () => {
            console.log('✅ 카메라 준비 완료');
            setCameraReady(true);

            const loaded = await loadUserEmbedding();
            if (loaded) {
              startVerificationLoop(); // embedding preload 성공 시 루프 시작
            } else {
              addDebugInfo('❌ embedding preload 실패로 인증 루프 중단');
            }
          })();
        };
      }

      setError(null);
      setShowError(false);
    } catch (err) {
      console.error('❌ 카메라 접근 오류:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      setShowError(true);
      setCameraReady(false);
    }
  };

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  // 프레임 캡처
  const captureFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg');
    });
  };

  // 실시간 얼굴 인증 루프 시작
  const startVerificationLoop = () => {
    intervalRef.current = setInterval(async () => {
      const frameBlob = await captureFrame();
      if (!frameBlob) {
        addDebugInfo('⚠️ 프레임 캡처 실패');
        return;
      }

      setIsVerifying(true);
      setError(null);
      setShowError(false);

      try {
        const formData = new FormData();
        formData.append('frame', frameBlob, 'frame.jpg');
        formData.append('target_user_id', targetUserId);

        const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';

        addDebugInfo(`AI 서버 URL: ${aiServerUrl}`);
        addDebugInfo(`사용자 ID: ${targetUserId}`);
        addDebugInfo(`프레임 크기: ${frameBlob.size} bytes`);
        addDebugInfo('서버 요청 시작...');

        const response = await fetch(`${aiServerUrl}/face/verify-frame`, {
          method: 'POST',
          body: formData,
        });

        addDebugInfo(`응답 상태: ${response.status}`);

        const result = await response.json();
        addDebugInfo(`응답 내용: ${JSON.stringify(result)}`);

        if (response.ok && result.verified) {
          addDebugInfo('✅ 얼굴 인증 성공!');
          if (intervalRef.current) clearInterval(intervalRef.current);
          onSuccess(result.face_hash);
        } else {
          const errorMsg = result.error || result.detail || '인증 실패';
          addDebugInfo(`❌ 인증 실패: ${errorMsg}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
        addDebugInfo(`❌ 네트워크 오류: ${errorMsg}`);
        setError(`네트워크 오류: ${errorMsg}`);
        setShowError(true);
      } finally {
        setIsVerifying(false);
      }
    }, 1000);
  };

  // 에러 닫기
  const closeError = () => {
    setShowError(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">얼굴 인증 (실시간)</h2>

        {/* 비디오 영역 */}
        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-80 bg-gray-200 rounded-lg object-cover"
            style={{ aspectRatio: '9/16' }}
          />

          {/* 인증 중 오버레이 */}
          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <div className="text-lg">🧠 AI 인증 중...</div>
              </div>
            </div>
          )}
        </div>

        {/* 디버그 정보 */}
        {debugInfo.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded">
            <div className="text-sm font-semibold text-blue-800 mb-2">디버그 정보:</div>
            {debugInfo.map((info, index) => (
              <div key={index} className="text-xs text-blue-700 mb-1">
                {info}
              </div>
            ))}
          </div>
        )}

        {/* 에러 메시지 */}
        {showError && error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded relative">
            <span>{error}</span>
            <button
              onClick={closeError}
              className="absolute top-1 right-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            취소
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-3 text-center">
          🎯 카메라가 켜지면 실시간으로 얼굴 인증을 시도합니다.
        </p>
      </div>
    </div>
  );
};

export default FaceVerificationComponent;
