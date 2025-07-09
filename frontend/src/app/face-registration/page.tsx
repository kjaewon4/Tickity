'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function FaceRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // URL에서 사용자 ID 가져오기
  const userId = searchParams.get('user_id');

  useEffect(() => {
    if (!userId) {
      setError('사용자 ID가 없습니다. 다시 로그인해주세요.');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    // 컴포넌트 마운트 시 자동으로 카메라 시작
    startCamera();

    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId, router]);

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
          console.log('✅ 카메라 준비 완료');
          setCameraReady(true);
        };
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ 카메라 접근 오류:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      setCameraReady(false);
    }
  };

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

  const startRecording = () => {
    if (!streamRef.current || !cameraReady) {
      setError('카메라가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // 자동으로 등록 시작
      registerFace();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    setError(null);

    // 3초 타이머
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 6) {
          mediaRecorder.stop();
          return 6;
        }
        return newTime;
      });
    }, 1000);
  };

  const registerFace = async () => {
    if (recordedChunksRef.current.length === 0) {
      setError('녹화된 비디오가 없습니다.');
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('user_id', userId!);
      formData.append('video', videoBlob, 'face_registration.webm');

      const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';
      
      console.log(`💾 얼굴 등록 요청: AI 서버 ${aiServerUrl}, 사용자 ID: ${userId}`);
      console.log(`📹 비디오 크기: ${videoBlob.size} bytes`);

      const response = await fetch(`${aiServerUrl}/face/register`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('✅ 얼굴 등록 응답:', result);

      if (response.ok && result.message) {
        setSuccess('얼굴 등록이 완료되었습니다! 잠시 후 메인 페이지로 이동합니다.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        const errorMsg = result.error || result.detail || '얼굴 등록에 실패했습니다.';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`네트워크 오류: ${errorMsg}`);
    } finally {
      setIsRegistering(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">등록 완료!</h2>
            <p className="text-gray-600">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-center mb-8">얼굴 등록</h1>
          
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
            <h3 className="font-bold">사용 방법</h3>
            <ul className="mt-2 list-disc list-inside text-sm">
              <li>얼굴이 화면 중앙에 잘 보이도록 위치하세요</li>
              <li>녹화 버튼을 눌러 6초간 비디오를 촬영하세요 (자동 중지)</li>
              <li>자동으로 얼굴 정보가 등록됩니다</li>
              <li><strong>AI가 6초 동안 여러 프레임을 분석해 최적의 얼굴 데이터를 생성합니다</strong></li>
            </ul>
          </div>

          <div className="camera-container relative mb-6">
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              className="w-full h-96 object-cover bg-black rounded-lg"
              style={{ aspectRatio: '9/16' }}
            />
            
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>카메라 준비 중...</p>
                </div>
              </div>
            )}

            {/* 녹화 중 표시 */}
            {isRecording && (
              <>
                {/* 빨간 녹화 점 */}
                <div className="absolute top-2 left-2 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-white font-bold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    REC
                  </span>
                </div>
                {/* 타이머 */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  <span className="font-bold">{recordingTime}/6초</span>
                </div>
                {/* 가이드 테두리 */}
                <div className="absolute inset-2 border-2 border-green-400 rounded-lg pointer-events-none"></div>
              </>
            )}
            
            {/* 등록 중 오버레이 */}
            {isRegistering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <div className="text-lg">AI가 얼굴 데이터를 분석 중...</div>
                  <div className="text-sm mt-2">KMeans 클러스터링 + 이상치 제거</div>
                </div>
              </div>
            )}
          </div>

          {/* 녹화 타이머 표시 */}
          {isRecording && (
            <div className="text-center mb-6">
              <div className="text-xl font-bold text-red-600">
                녹화 중... {recordingTime}/3초
              </div>
              <div className="text-sm text-gray-600 mt-1">
                AI가 최적의 프레임들을 자동 선별합니다
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            {!isRecording && !isRegistering ? (
              <button
                onClick={startRecording}
                disabled={!cameraReady}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cameraReady ? '6초 녹화 시작' : '카메라 준비 중...'}
              </button>
            ) : isRegistering ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-600">AI 분석 중... (KMeans + 이상치 제거)</span>
              </div>
            ) : (
              <div className="text-gray-600">녹화 중...</div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
              <strong className="font-bold">오류:</strong>
              <span className="ml-2">{error}</span>
              <div className="mt-2">
                <button
                  onClick={() => {
                    setError(null);
                    if (!cameraReady) {
                      startCamera();
                    } else {
                      startRecording();
                    }
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              얼굴 등록은 안전한 서비스 이용을 위해 필수입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaceRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FaceRegistrationContent />
    </Suspense>
  );
} 