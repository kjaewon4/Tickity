'use client';

import React, { useState } from 'react';
import QRScanner from '@/components/QRScanner';

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
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScanSuccess = (result: VerificationResult) => {
    setVerificationResult(result);
    setShowScanner(false);
    setError(null);
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setShowScanner(false);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
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
      reasons.push('얼굴 인증 미완료 (테스트 중 우회됨)');
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
              NFT 티켓의 QR 코드를 스캔하여 인증하세요.
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              QR 코드 스캔 시작
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong className="font-bold">오류:</strong>
              <span className="ml-2">{error}</span>
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
    </div>
  );
} 