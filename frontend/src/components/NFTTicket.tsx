// components/NFTTicket.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaArrowLeft } from 'react-icons/fa';
import { BsQrCode } from 'react-icons/bs';
import QRCode from 'react-qr-code';
import { apiClient } from '@/lib/apiClient';

interface NFTTicketProps {
  ticket: {
    id: string;
    concertTitle: string;
    performer?: string;
    date: string;
    time: string;
    venue: string;
    seatInfo: string;
    price: number;
    tokenId: string;
    Holder?: string;
  };
  onClose?: () => void;
  showCloseButton?: boolean;
  onQRVisibilityChange?: (isShowing: boolean) => void; // 부모에게 QR 표시 상태를 알림
}

const NFTTicket: React.FC<NFTTicketProps> = ({
  ticket,
  onClose,
  showCloseButton = true,
  onQRVisibilityChange, // prop으로 받도록 추가
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);
  const [qrError, setQrError] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);

  // showQR 상태 변경 감지 및 부모에게 알림
  useEffect(() => {
    if (onQRVisibilityChange) {
      onQRVisibilityChange(showQR);
    }
  }, [showQR, onQRVisibilityChange]);


  useEffect(() => {
    const generateQRData = async () => {
      try {
        setQrLoading(true);
        setQrError('');

        if (ticket.id && ticket.id !== 'undefined') {
          try {
            const response = await apiClient.getQRData(ticket.id);
            if (response.success && response.data) {
              setQrData(response.data.qrString);
            } else {
              throw new Error('QR 데이터를 가져올 수 없습니다 (API 실패)');
            }
          } catch (apiError) {
            console.error("API 호출 실패, 더미 데이터 사용:", apiError);
            const dummyQRData = {
              tokenId: ticket.tokenId || '0',
              contractAddress: '0x0000000000000000000000000000000000000000',
              ticketId: ticket.id || 'dummy-ticket-id',
            };
            setQrData(JSON.stringify(dummyQRData));
          }
        } else {
          console.warn("Ticket ID is invalid or undefined, using dummy QR data.");
          const dummyQRData = {
            tokenId: ticket.tokenId || '0',
            contractAddress: '0x0000000000000000000000000000000000000000',
            ticketId: 'dummy-ticket-id',
          };
          setQrData(JSON.stringify(dummyQRData));
        }
      } catch (error) {
        console.error("QR 코드 생성 중 치명적 오류:", error);
        setQrError('QR 코드 생성 실패');
        const dummyQRData = {
          tokenId: ticket.tokenId || '0',
          contractAddress: '0x0000000000000000000000000000000000000000',
          ticketId: 'error-ticket-id',
        };
        setQrData(JSON.stringify(dummyQRData));
      } finally {
        setQrLoading(false);
      }
    };

    generateQRData();
  }, [ticket.id, ticket.tokenId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr.replace(/\./g, '-'));
        if (isNaN(date.getTime())) {
            return dateStr;
        }
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
        });
    } catch (e) {
        console.error("날짜 형식 변환 오류:", e);
        return dateStr;
    }
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return 'N/A';
    }
    return price.toLocaleString('ko-KR');
  };

  const ticketContainerWidthClass = 'w-[380px]';
  const estimatedTicketHeight = '450px'; 

  return (
    <div className="relative p-4">
      <div
        className={`relative ${ticketContainerWidthClass} bg-[#1A1B1E] rounded-3xl p-10 text-white shadow-2xl`}
        style={{
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% calc(33% - 20px), calc(100% - 12px) 33%,
            100% calc(33% + 20px), 100% 100%, 0% 100%, 0% calc(33% + 20px),
            12px 33%, 0% calc(33% - 20px)
          )`,
          minHeight: estimatedTicketHeight,
        }}
        id={showQR ? 'qr-ticket-view' : undefined}
      >
        {showQR ? (
          <div className="flex flex-col items-center justify-center space-y-6 h-full py-10"> 
            <h2 className="text-xl font-bold text-center">NFT 티켓 QR 코드</h2>
            <div className="bg-white p-4 rounded-lg">
              {qrLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
              ) : qrError ? (
                <p className="text-red-500">{qrError}</p>
              ) : (
                <QRCode
                  value={qrData}
                  size={256}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                  title="NFT 티켓 QR 코드"
                />
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                setShowQR(false);
              }}
              className="flex items-center gap-2 mt-4 text-lg text-gray-200 hover:text-white cursor-pointer"
            >
              <FaArrowLeft size={14} />
              <span>티켓으로 돌아가기</span>
            </button>
          </div>
        ) : (
          <>
            {/* 기존 티켓 상세 정보 */}
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-gray-300">NFT TICKET</h3>
                <p className="text-xs text-gray-400">TIKITY</p>
              </div>
              {showCloseButton && onClose && (
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  <FaTimes size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            <div className="space-y-3 mb-8">
              <h1 className="text-2xl font-bold">{ticket.concertTitle}</h1>
              {ticket.performer && (
                <p className="text-sm text-gray-400">{ticket.performer}</p>
              )}
            </div>

            <div className="relative my-8">
              <div className="border-t-2 border-dashed border-gray-600"></div>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-6 text-sm mb-8">
              <div className="space-y-2">
                <p className="text-gray-500">공연일</p>
                <p className="font-medium">{formatDate(ticket.date)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">시간</p>
                <p className="font-medium">{ticket.time}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">장소</p>
                <p className="font-medium">{ticket.venue}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">좌석</p>
                <p className="font-medium">{ticket.seatInfo}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="bg-gray-800 p-4 rounded-xl w-28 h-28 flex items-center justify-center border border-gray-700">
                {qrLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                ) : qrError ? (
                  <BsQrCode size={64} className="text-gray-400" />
                ) : qrData ? (
                  <QRCode
                    value={qrData}
                    size={112}
                    bgColor="#1A1B1E"
                    fgColor="#FFFFFF"
                    level="M"
                    title="NFT 티켓 QR 코드"
                  />
                ) : (
                  <BsQrCode size={64} className="text-gray-400" />
                )}
              </div>
              <div className="text-right space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">예매자</p>
                  <p className="text-lg font-bold font-mono tracking-widest text-white">
                    {ticket.Holder}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">가격</p>
                  <p className="text-xl font-bold text-white">
                    {formatPrice(ticket.price)}원
                  </p>
                </div>
              </div>
            </div>

            {/* "자세히 보기" 버튼 - 이 버튼 클릭 시 NFTTicket 내부에서 QR 화면으로 전환 */}
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                setShowQR(true);
              }}
              className="w-full bg-[#9f6efc] hover:bg-[#a781ff] text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FaEye size={16} />
              <span>자세히 보기</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default NFTTicket;