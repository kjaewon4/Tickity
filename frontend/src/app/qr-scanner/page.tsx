'use client';

import React, { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import FaceVerificationComponent from '@/components/FaceVerificationComponent';

interface VerificationResult {
  isValid: boolean;
  ticketInfo: {
    tokenId: string;
    ticketId: string;
    concertTitle: string;
    date: string;
    time: string;
    venue: string;
    seatInfo: string;
    price: number;
    holder: string;
  };
  verification: {
    ownershipValid: boolean;
    usageStatusValid: boolean;
    faceVerificationValid: boolean;
    cancellationStatusValid: boolean;
    errors: string[];
  };
}

export default function QRScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<any>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingEntry, setIsProcessingEntry] = useState(false);

  const handleScanSuccess = async (result: any) => {
    console.log('🔍 QR 스캔 성공:', result);
    setQrScanResult(result);
    setShowScanner(false);
    setError(null);

    // QR 데이터에서 사용자 ID 추출
    if (result.ticketInfo?.ticketId) {
      try {
        // 티켓 ID로 사용자 ID 조회
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/user-by-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketId: result.ticketInfo.ticketId
          }),
        });

        const userData = await response.json();
        if (userData.success && userData.data.userId) {
          console.log('🔍 조회된 사용자 ID:', userData.data.userId);
          setTargetUserId(userData.data.userId);
          setShowFaceVerification(true);
        } else {
          setError(`사용자 조회 실패: ${userData.error || '알 수 없는 오류'}`);
        }
      } catch (error: any) {
        console.error('사용자 정보 조회 오류:', error);
        setError('사용자 정보 조회중 오류가 발생했습니다.');
      }
    } else {
      setError('QR 코드에서 티켓 정보를 찾을 수 없습니다.');
    }
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setShowScanner(false);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const handleFaceVerificationSuccess = async (faceHash?: string) => {
    console.log('🎭 얼굴 인증 성공! 입장 처리 시작...', { faceHash });
    setShowFaceVerification(false);
    setIsProcessingEntry(true);

    try {
      // 1. 블록체인에 얼굴 인증 완료 표시 (face_hash 포함)
      if (qrScanResult?.ticketInfo?.tokenId) {
        const faceCompleteResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/face-verification-complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId: qrScanResult.ticketInfo.tokenId,
            userId: targetUserId,
            faceHash: faceHash // AI 서버에서 받은 얼굴 해시 전달
          }),
        });

        const faceCompleteResult = await faceCompleteResponse.json();
        console.log('🎭 블록체인 얼굴 인증 처리 결과:', faceCompleteResult);

        if (!faceCompleteResult.success) {
          console.warn('⚠️ 블록체인 얼굴 인증 처리 실패:', faceCompleteResult.error);
          // 얼굴 해시 등록 실패 시 오류 표시하고 중단
          setError(`블록체인 얼굴 해시 등록 실패: ${faceCompleteResult.error || '알 수 없는 오류'}`);
          setIsProcessingEntry(false);
          return;
        }
      }

      // 2. 최종 검증 및 입장 처리
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: JSON.stringify(qrScanResult.ticketInfo || qrScanResult)
        }),
      });

      const finalResult = await verifyResponse.json();
      console.log('🔍 최종 검증 결과:', finalResult);

      if (finalResult.success) {
        setVerificationResult(finalResult.data);
      } else {
        setError(finalResult.error || '검증 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('입장 처리 오류:', err);
      setError('입장 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessingEntry(false);
    }
  };

  const handleFaceVerificationCancel = () => {
    setShowFaceVerification(false);
    setQrScanResult(null);
    setTargetUserId('');
    setError('얼굴 인증이 취소되었습니다.');
  };

  const handleRetryFaceVerification = () => {
    setError(null);
    setShowFaceVerification(true);
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? '인증 성공 - 입장 처리 완료' : '인증 실패 - 사용 불가';
  };

  const getStatusDescription = (result: VerificationResult) => {
    if (result.isValid) {
      return '티켓이 성공적으로 인증되었고 입장 처리가 완료되었습니다.';
    }

    // 사용 불가 이유 분석
    const reasons = [];
    
    if (!result.verification.ownershipValid) {
      reasons.push('소유권 확인 실패');
    }
    if (!result.verification.usageStatusValid) {
      reasons.push('이미 사용된 티켓');
    }
    if (!result.verification.faceVerificationValid) {
      reasons.push('얼굴 인증 미완료');
    }
    if (!result.verification.cancellationStatusValid) {
      reasons.push('취소된 티켓');
    }

    return `사용 불가: ${reasons.join(', ')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center mb-8">QR 코드 인증</h1>
          
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              NFT 티켓의 QR 코드를 스캔하고 얼굴 인증을 통해 입장하세요.
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              QR 코드 스캔 시작
            </button>
          </div>

          {isProcessingEntry && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-3"></div>
                <span>입장 처리 중입니다. 잠시만 기다려주세요...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">오류:</strong>
              <span className="ml-2">{error}</span>
              {error.includes('얼굴 인증') && qrScanResult && (
                <button
                  onClick={handleRetryFaceVerification}
                  className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {verificationResult && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">인증 결과</h2>
              
              <div className={`text-xl font-bold mb-4 ${getStatusColor(verificationResult.isValid)}`}>
                {getStatusText(verificationResult.isValid)}
              </div>

              <div className="mb-4 p-4 bg-white rounded border">
                <p className="text-gray-700">
                  {getStatusDescription(verificationResult)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">티켓 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">콘서트:</span> {verificationResult.ticketInfo.concertTitle}
                    </div>
                    <div>
                      <span className="font-medium">날짜:</span> {verificationResult.ticketInfo.date}
                    </div>
                    <div>
                      <span className="font-medium">시간:</span> {verificationResult.ticketInfo.time}
                    </div>
                    <div>
                      <span className="font-medium">장소:</span> {verificationResult.ticketInfo.venue}
                    </div>
                    <div>
                      <span className="font-medium">좌석:</span> {verificationResult.ticketInfo.seatInfo}
                    </div>
                    <div>
                      <span className="font-medium">가격:</span> {verificationResult.ticketInfo.price.toLocaleString()}원
                    </div>
                    <div>
                      <span className="font-medium">소유자:</span> {verificationResult.ticketInfo.holder}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">검증 결과</h3>
                  <div className="space-y-2 text-sm">
                    <div className={`flex justify-between ${verificationResult.verification.ownershipValid ? 'text-green-600' : 'text-red-600'}`}>
                      <span>소유권 확인:</span>
                      <span>{verificationResult.verification.ownershipValid ? '✓' : '✗'}</span>
                    </div>
                    <div className={`flex justify-between ${verificationResult.verification.usageStatusValid ? 'text-green-600' : 'text-red-600'}`}>
                      <span>사용 상태:</span>
                      <span>{verificationResult.verification.usageStatusValid ? '✓' : '✗'}</span>
                    </div>
                    <div className={`flex justify-between ${verificationResult.verification.faceVerificationValid ? 'text-green-600' : 'text-red-600'}`}>
                      <span>얼굴 인증:</span>
                      <span>{verificationResult.verification.faceVerificationValid ? '✓' : '✗'}</span>
                    </div>
                    <div className={`flex justify-between ${verificationResult.verification.cancellationStatusValid ? 'text-green-600' : 'text-red-600'}`}>
                      <span>취소 상태:</span>
                      <span>{verificationResult.verification.cancellationStatusValid ? '✓' : '✗'}</span>
                    </div>
                  </div>

                  {verificationResult.verification.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2">오류 사항:</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {verificationResult.verification.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setVerificationResult(null);
                    setQrScanResult(null);
                    setTargetUserId('');
                    setError(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  다시 스캔
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          onClose={handleCloseScanner}
        />
      )}

      {showFaceVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">얼굴 인증</h2>
            <p className="text-gray-600 mb-4 text-center">
              입장을 위해 얼굴 인증을 진행해주세요.
            </p>
            <FaceVerificationComponent
              targetUserId={targetUserId}
              onSuccess={handleFaceVerificationSuccess}
              onCancel={handleFaceVerificationCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
} 