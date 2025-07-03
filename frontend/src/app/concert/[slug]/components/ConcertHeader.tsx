import React from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { LuClock } from 'react-icons/lu';
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
<div className="rounded-2xl p-8 shadow-xl flex flex-col gap-6">
  <div className="flex gap-8 items-start">
    <div className="relative w-48 h-48">
      <LazyImage 
        src={ticketInfo.image} 
        alt="concert" 
        fill
        sizes="192px"
        className="object-cover rounded-xl"
        quality={70}
        priority={true}
        imageSize="small"
      />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {ticketInfo.title}
        </h2>
        <button 
          onClick={onFavoriteToggle} 
          disabled={favoriteLoading}
          className={`text-gray-400 hover:text-red-500 text-2xl transition-colors ${
            favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {liked ? <AiFillHeart className="text-red-500" /> : <AiOutlineHeart />}
        </button>
      </div>
      <p className="text-base text-gray-500">{ticketInfo.subtitle}</p>
      <div className="mt-4 space-y-2 text-base text-gray-700">
        <div className="flex items-center gap-2 text-gray-500">
          <HiOutlineLocationMarker className="text-lg" />
          <span>{ticketInfo.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <MdOutlineCalendarToday className="text-lg" />
          <span>{ticketInfo.dateRange}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <LuClock className="text-lg" />
          <span>{ticketInfo.runtime}</span>
        </div>
      </div>
    </div>
  </div>

  <div className="bg-gray-100 px-6 py-4 rounded-md flex justify-between items-center w-full">
    <span className="text-base text-gray-500">가격</span>
    <span className="text-blue-600 font-semibold text-lg">{ticketInfo.price}</span>
  </div>
</div>

  );
};

export default ConcertHeader;
