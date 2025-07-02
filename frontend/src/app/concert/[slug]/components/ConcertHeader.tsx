import React from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { TicketInfo } from '../types';
import LazyImage from '@/components/LazyImage';

interface ConcertHeaderProps {
  ticketInfo: Pick<TicketInfo, 'image' | 'title' | 'subtitle' | 'location' | 'dateRange' | 'runtime' | 'price'>;
  liked: boolean;
  favoriteLoading: boolean;
  onFavoriteToggle: () => void;
}

const ConcertHeader: React.FC<ConcertHeaderProps> = ({
  ticketInfo,
  liked,
  favoriteLoading,
  onFavoriteToggle
}) => {
  return (
    <div className="rounded-2xl p-6 shadow-xl flex flex-col gap-4">
      <div className="flex gap-6 items-start">
        <div className="relative w-40 h-40">
          <LazyImage 
            src={ticketInfo.image} 
            alt="concert" 
            fill
            sizes="160px"
            className="object-cover rounded-lg"
            quality={70}
            priority={true} // 상세페이지 메인 이미지는 우선 로드
            imageSize="small"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {ticketInfo.title}
            </h2>
            <button 
              onClick={onFavoriteToggle} 
              disabled={favoriteLoading}
              className={`text-gray-400 hover:text-red-500 text-xl transition-colors ${
                favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {liked ? <AiFillHeart className="text-red-500" /> : <AiOutlineHeart />}
            </button>
          </div>
          <p className="text-sm text-gray-500">{ticketInfo.subtitle}</p>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <div>📍 {ticketInfo.location}</div>
            <div>📅 {ticketInfo.dateRange}</div>
            <div>⏱ {ticketInfo.runtime}</div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-3 rounded-md flex justify-between items-center w-full">
        <span className="text-sm text-gray-500">가격</span>
        <span className="text-blue-600 font-semibold text-base">{ticketInfo.price}</span>
      </div>
    </div>
  );
};

export default ConcertHeader; 