import React, { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaEye } from 'react-icons/fa';
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
  onViewDetails?: () => void;
  showCloseButton?: boolean;
}

const NFTTicket: React.FC<NFTTicketProps> = ({ 
  ticket, 
  onClose, 
  onViewDetails,
  showCloseButton = true 
}) => {
  const [qrData, setQrData] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(true);
  const [qrError, setQrError] = useState<string>('');

  // QR 코드 데이터 생성
  useEffect(() => {
    const generateQRData = async () => {
      try {
        setQrLoading(true);
        setQrError('');
        
        console.log('🔍 티켓 정보 확인:', {
          id: ticket.id,
          tokenId: ticket.tokenId,
          concertTitle: ticket.concertTitle
        });
        
        // 티켓 ID가 있는 경우에만 QR 데이터 생성
        if (ticket.id && ticket.id !== 'undefined') {
          try {
            console.log('📡 QR 데이터 요청:', ticket.id);
            const response = await apiClient.getQRData(ticket.id);
            if (response.success && response.data) {
              console.log('✅ QR 데이터 수신:', response.data);
              setQrData(response.data.qrString);
            } else {
              throw new Error('QR 데이터를 가져올 수 없습니다');
            }
          } catch (apiError) {
            console.error('API 호출 실패, 더미 데이터 사용:', apiError);
            // API 실패 시 더미 데이터 사용
            const dummyQRData = {
              tokenId: ticket.tokenId || '0',
              contractAddress: '0x0000000000000000000000000000000000000000',
              ticketId: ticket.id || 'dummy-ticket-id'
            };
            console.log('📝 더미 QR 데이터 생성:', dummyQRData);
            setQrData(JSON.stringify(dummyQRData));
          }
        } else {
          console.log('⚠️ 티켓 ID 없음, 더미 데이터 사용');
          // 티켓 ID가 없는 경우 더미 데이터 사용
          const dummyQRData = {
            tokenId: ticket.tokenId || '0',
            contractAddress: '0x0000000000000000000000000000000000000000',
            ticketId: 'dummy-ticket-id'
          };
          setQrData(JSON.stringify(dummyQRData));
        }
      } catch (error) {
        console.error('QR 데이터 생성 오류:', error);
        setQrError('QR 코드 생성 실패');
        
        // 에러 시에도 더미 데이터 사용
        const dummyQRData = {
          tokenId: ticket.tokenId || '0',
          contractAddress: '0x0000000000000000000000000000000000000000',
          ticketId: 'error-ticket-id'
        };
        setQrData(JSON.stringify(dummyQRData));
      } finally {
        setQrLoading(false);
      }
    };

    generateQRData();
  }, [ticket.id, ticket.tokenId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };
  
  return (
    <div className="relative p-4">
      <div 
        className="relative w-[380px] bg-[#1A1B1E] rounded-3xl p-10 text-white shadow-2xl"
        style={{
          clipPath: `polygon(
            0% 0%,                          /* 왼쪽 상단 */
            100% 0%,                        /* 오른쪽 상단 */
            100% calc(33% - 20px),          /* 오른쪽 반원 시작 */
            calc(100% - 12px) 33%,          /* 오른쪽 반원 중간 */
            100% calc(33% + 20px),          /* 오른쪽 반원 끝 */
            100% 100%,                      /* 오른쪽 하단 */
            0% 100%,                        /* 왼쪽 하단 */
            0% calc(33% + 20px),            /* 왼쪽 반원 끝 */
            12px 33%,                       /* 왼쪽 반원 중간 */
            0% calc(33% - 20px)             /* 왼쪽 반원 시작 */
          )`
        }}
      >
        {/* 헤더 */}
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

        {/* 콘서트 정보 */}
        <div className="space-y-3 mb-8">
          <h1 className="text-2xl font-bold">{ticket.concertTitle}</h1>
          {ticket.performer && <p className="text-sm text-gray-400">{ticket.performer}</p>}
        </div>

        {/* 절취선 */}
        <div className="relative my-8">
          <div className="border-t-2 border-dashed border-gray-600"></div>
        </div>

        {/* 상세 정보 */}
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

        {/* QR 코드 및 가격 */}
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
                title="NFT Ticket QR Code"
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
              <p className="text-xl font-bold text-white">{formatPrice(ticket.price)}원</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onViewDetails}
          className="w-full bg-[#9f6efc] hover:bg-[#a781ff] text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
        >
          <FaEye size={16} />
          <span>자세히 보기</span>
        </button>
      </div>
    </div>
  );
};

export default NFTTicket;