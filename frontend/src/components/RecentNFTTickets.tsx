'use client';

import React, { useState, MouseEvent } from 'react';
import NFTTicket from '@/components/NFTTicket';
import { TicketInfo } from '@/types/ticket';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

const getAttributeValue = (attributes: any[] | undefined, traitType: string) => {
  if (!attributes) return '';
  const attribute = attributes.find(attr => attr.trait_type === traitType);
  return attribute ? attribute.value : '';
};

const isFutureDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const now = new Date();
  const concertDate = new Date(dateStr.replace(/\./g, '-') + 'T00:00:00');
  return concertDate >= now;
};

interface Props {
  tickets?: TicketInfo[];
  onQRShowingChange?: (val: boolean) => void;
}

const RecentNFTTickets = ({ tickets = [], onQRShowingChange }: Props) => {
  const validTickets = tickets.filter(ticket => {
    const dateStr = getAttributeValue(ticket.metadata.attributes, 'Date');
    const isFuture = isFutureDate(dateStr);
    const isNotCancelled = !ticket.is_cancelled; // 취소되지 않은 티켓만 포함
    
    return isFuture && isNotCancelled;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnyQRVisible, setIsAnyQRVisible] = useState(false);

  const handleNFTTicketQRVisibilityChange = (isShowing: boolean) => {
    setIsAnyQRVisible(isShowing);
    onQRShowingChange?.(isShowing);
  };

  const scrollLeft = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const scrollRight = (e: MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) =>
      prev < validTickets.length - 1 ? prev + 1 : prev
    );
  };

  if (validTickets.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        예정된 NFT 티켓이 없습니다.
      </div>
    );
  }

  const currentTicket = validTickets[currentIndex];

  const ticketProps = {
    ticket: {
      id: currentTicket.ticketId,
      concertTitle: getAttributeValue(currentTicket.metadata.attributes, 'Concert'),
      date: getAttributeValue(currentTicket.metadata.attributes, 'Date'),
      time: getAttributeValue(currentTicket.metadata.attributes, 'Time'),
      venue: getAttributeValue(currentTicket.metadata.attributes, 'Venue'),
      seatInfo: getAttributeValue(currentTicket.metadata.attributes, 'Seat'),
      price: currentTicket.price,
      tokenId: currentTicket.tokenId,
      Holder: getAttributeValue(currentTicket.metadata.attributes, 'Holder'),
      performer: getAttributeValue(currentTicket.metadata.attributes, 'Performer'),
    },
    showCloseButton: false,
    onQRVisibilityChange: handleNFTTicketQRVisibilityChange,
  };

  return (
    <div
      className={`relative w-full flex justify-center items-center py-4 overflow-visible transition-all duration-300 ${isAnyQRVisible ? 'min-h-[560px]' : 'min-h-[500px]'}`}
    >
      {validTickets.length > 1 && !isAnyQRVisible && (
        <button
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          <IoChevronBack size={16} />
        </button>
      )}

      <div className="w-[380px] flex flex-col justify-center items-center mx-auto scale-[0.72] overflow-visible -mt-27">
        <NFTTicket {...ticketProps} />
      </div>

      {validTickets.length > 1 && !isAnyQRVisible && (
        <button
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white shadow p-1 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          <IoChevronForward size={16} />
        </button>
      )}
    </div>
  );
};

export default RecentNFTTickets;
