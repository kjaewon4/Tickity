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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
        // 비디오가 로드되면 카메라 준비 완료
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ 카메라 준비 완료');
          setCameraReady(true);
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

  // 3초 자동 녹화 시작
  const startRecording = () => {
    console.log('🔍 녹화 시작 시도:', { cameraReady, streamRef: !!streamRef.current });
    
    if (!streamRef.current || !cameraReady) {
      setError('카메라가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      setShowError(true);
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
      // 자동으로 인증 시작
      verifyFace();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    setError(null);
    setShowError(false);

    // 3초 타이머
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 3) {
          mediaRecorder.stop();
          return 3;
        }
        return newTime;
      });
    }, 1000);
  };

  // 디버그 정보 추가
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  // 얼굴 인증 처리
  const verifyFace = async () => {
    if (recordedChunksRef.current.length === 0) {
      setError('녹화된 비디오가 없습니다.');
      setShowError(true);
      return;
    }

    setIsVerifying(true);
    setError(null);
    setShowError(false);

    try {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('frame', videoBlob, 'face_verification.webm');
      formData.append('target_user_id', targetUserId);

      const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'http://localhost:8000';
      
      addDebugInfo(`AI 서버 URL: ${aiServerUrl}`);
      addDebugInfo(`사용자 ID: ${targetUserId}`);
      addDebugInfo(`비디오 크기: ${videoBlob.size} bytes`);
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
        onSuccess(result.face_hash);
      } else {
        const errorMsg = result.error || result.detail || '얼굴 인증에 실패했습니다.';
        addDebugInfo(`❌ 인증 실패: ${errorMsg}`);
        setError(errorMsg);
        setShowError(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      addDebugInfo(`❌ 네트워크 오류: ${errorMsg}`);
      setError(`네트워크 오류: ${errorMsg}`);
      setShowError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  // 에러 닫기
  const closeError = () => {
    setShowError(false);
    setError(null);
  };

  // 자동 카메라 시작
  useEffect(() => {
    startCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-center">얼굴 인증</h2>
        
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
          
          {/* 녹화 중 표시 - 상단에만 표시하여 얼굴이 보이도록 */}
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
                <span className="font-bold">{recordingTime}/3초</span>
              </div>
              {/* 가이드 테두리 */}
              <div className="absolute inset-2 border-2 border-green-400 rounded-lg pointer-events-none"></div>
            </>
          )}
          
          {/* 인증 중 오버레이 */}
          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <div className="text-lg">🧠 AI 인증 중...</div>
                <div className="text-sm mt-1">KMeans + 이상치 제거 분석</div>
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
          {!isRecording && !isVerifying && (
            <button
              onClick={startRecording}
              disabled={!cameraReady}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cameraReady ? '🎬 인증 시작' : '카메라 준비 중...'}
            </button>
          )}
          
          <button
            onClick={onCancel}
            disabled={isRecording || isVerifying}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            취소
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-3 text-center">
          🎯 인증 시작을 누르면 3초간 자동으로 녹화되어 <strong>AI가 최적의 얼굴 데이터로 분석</strong>합니다.
        </p>
      </div>
    </div>
  );
};

export default FaceVerificationComponent; 