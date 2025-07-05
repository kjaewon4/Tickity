import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { apiClient } from '@/lib/apiClient';

interface QRScannerProps {
  onScanSuccess: (result: any) => void;
  onScanError?: (error: string) => void;
  onClose?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScanSuccess, 
  onScanError, 
  onClose 
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [error, setError] = useState<string | null>(null);

  // 카메라 권한 확인
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(permission.state);
          
          permission.onchange = () => {
            setCameraPermission(permission.state);
          };
        }
      } catch (error) {
        console.log('카메라 권한 확인 실패:', error);
      }
    };

    checkCameraPermission();
  }, []);

  // 카메라 권한 요청
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      setError(null);
      return true;
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error);
      setCameraPermission('denied');
      setError('카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      return false;
    }
  };

  useEffect(() => {
    if (!scanning) return;

    const newScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        // 모바일 최적화 설정
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
      },
      false
    );

    newScanner.render(
      (decodedText) => {
        // QR 코드 스캔 성공
        console.log('QR 코드 스캔 성공:', decodedText);
        
        // QR 코드 인증
        verifyQRCode(decodedText);
        
        // 스캐너 정리
        newScanner.clear();
        setScanning(false);
      },
      (errorMessage) => {
        // 스캔 에러는 무시 (연속적으로 발생)
        console.log('QR 스캔 에러:', errorMessage);
      }
    );

    setScanner(newScanner);

    return () => {
      if (newScanner) {
        newScanner.clear();
      }
    };
  }, [scanning]);

  const verifyQRCode = async (qrData: string) => {
    try {
      const response = await apiClient.verifyQRCode(qrData);
      
      if (response.success && response.data) {
        onScanSuccess(response.data);
      } else {
        onScanError?.(response.error || 'QR 코드 인증에 실패했습니다.');
      }
    } catch (error) {
      console.error('QR 코드 인증 오류:', error);
      onScanError?.('QR 코드 인증 중 오류가 발생했습니다.');
    }
  };

  const startScanning = async () => {
    // 카메라 권한 확인 및 요청
    if (cameraPermission !== 'granted') {
      const granted = await requestCameraPermission();
      if (!granted) {
        return;
      }
    }
    
    setScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
    }
    setScanning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">QR 코드 스캔</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            NFT 티켓의 QR 코드를 스캔하여 인증하세요.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!scanning ? (
          <div className="text-center">
            {cameraPermission === 'denied' && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.
              </div>
            )}
            
            <button
              onClick={startScanning}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={cameraPermission === 'denied'}
            >
              {cameraPermission === 'denied' ? '카메라 권한 필요' : '스캔 시작'}
            </button>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>• 모바일에서는 카메라 권한을 허용해야 합니다</p>
              <p>• QR 코드를 카메라에 맞춰주세요</p>
            </div>
          </div>
        ) : (
          <div>
            <div id="qr-reader" className="mb-4"></div>
            <div className="flex justify-center">
              <button
                onClick={stopScanning}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600"
              >
                스캔 중지
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner; 