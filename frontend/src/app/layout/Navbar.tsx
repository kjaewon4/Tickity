'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoTicketOutline } from 'react-icons/io5';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserInfo } from '@/types/auth';
import { createPortal } from 'react-dom';
import { IoMdHeartEmpty } from 'react-icons/io';
import apiClient from '@/lib/apiClient';
import { parseResidentNumber } from '@/utils/userUtils';
import RecentNFTTickets from '@/components/RecentNFTTickets';
import { TicketInfo, TicketMetadata } from '@/types/ticket';

const getUserDisplayName = (user: any) => user?.name || user?.email || '사용자';

interface NavbarProps {
  user?: UserInfo | null;
  loading?: boolean;
  handleLogout?: () => void;
}

const Navbar = ({ user, loading = false, handleLogout }: NavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [residentNumber, setResidentNumber] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketInfo[]>([]);
  const [showTicketDropdown, setShowTicketDropdown] = useState(false);
  const [isQRVisible, setIsQRVisible] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ticketDropdownRef = useRef<HTMLDivElement>(null);
  const ticketButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchResidentNumber = async () => {
      try {
        if (!user?.id) return;
        const res = await apiClient.getResidentNumber(user.id);
        const rrn = res.data?.residentNumber;
        if (rrn) {
          const { birthdate, gender } = parseResidentNumber(rrn);
          setResidentNumber(birthdate);
          setGender(gender);
        }
      } catch (error) {
        console.error('주민등록번호 조회 실패:', error);
      }
    };

    const fetchRecentTickets = async () => {
      try {
        if (!user?.id) return setRecentTickets([]);

        const { data: response } = await apiClient.get<{ tickets: any[] }>(`/tickets/my-tickets/${user.id}`);
        if (!response || !response.tickets) return setRecentTickets([]);

        const filtered = response.tickets.filter(
          t => t.nft_token_id && t.nft_token_id !== '0' && Number(t.nft_token_id) > 0
        );

        const limited = filtered.slice(0, 3);

        const ticketPromises = limited.map(async (ticket) => {
          try {
            const { data: metadata } = await apiClient.get<TicketMetadata>(`/tickets/metadata/${ticket.nft_token_id}`);
            if (!metadata) return null;
            return {
              tokenId: ticket.nft_token_id!,
              ticketId: ticket.id,
              metadata,
              price: ticket.purchase_price,
            } as TicketInfo;
          } catch (err) {
            console.warn(`토큰 ${ticket.nft_token_id} 메타데이터 로드 실패:`, err);
            return null;
          }
        });

        const resolved = await Promise.all(ticketPromises);
        const validTickets = resolved.filter((ticket): ticket is TicketInfo => ticket !== null);
        setRecentTickets(validTickets);
      } catch (err) {
        console.error('티켓 정보 조회 실패:', err);
        setRecentTickets([]);
      }
    };

    if (user?.id) {
      fetchResidentNumber();
      fetchRecentTickets();
    } else {
      setRecentTickets([]);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const qrView = document.getElementById('qr-ticket-view');
      const qrTrigger = document.getElementById('qr-trigger-button');

      if ((qrView && qrView.contains(target)) || (qrTrigger && qrTrigger.contains(target))) {
        return;
      }

      if (
        modalRef.current && !modalRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) setModalOpen(false);

      if (
        !isQRVisible &&
        ticketDropdownRef.current && !ticketDropdownRef.current.contains(target) &&
        ticketButtonRef.current && !ticketButtonRef.current.contains(target)
      ) setShowTicketDropdown(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQRVisible]);

  useEffect(() => {
    setModalOpen(false);
    setShowTicketDropdown(false);
  }, [pathname]);

  const getPopupPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return { top: rect.bottom + window.scrollY + 8, left: rect.right - 240 };
    }
    return { top: 0, left: 0 };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
      setShowSearch(false);
      setSearchKeyword('');
    }
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-gray-200 bg-white">
      <Link href="/">
        <div className="w-[120px] md:w-[150px] flex items-center cursor-pointer">
          <img src="/images/Tickity.svg" alt="Tickity Logo" className="object-contain h-12 md:h-14" />
        </div>
      </Link>

      <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto md:flex-1 md:justify-end gap-2 md:gap-3 relative">
        <form onSubmit={handleSearch} className="relative h-10 w-full md:max-w-sm lg:max-w-md flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="콘서트명 또는 가수명을 입력하세요."
            className="h-full w-full pl-4 pr-10 text-sm md:text-base border border-gray-300 rounded-full outline-none"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600">
            <FiSearch size={18} />
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-700 hover:bg-gray-100 px-2.5 py-2 rounded text-sm md:text-base font-semibold">
            Home
          </Link>

          <div className="relative">
            <button
              ref={ticketButtonRef}
              onClick={() => setShowTicketDropdown(prev => !prev)}
              className="flex items-center gap-1 text-gray-700 hover:bg-gray-100 px-2.5 py-2 rounded text-sm md:text-base font-semibold cursor-pointer"
            >
              <IoTicketOutline className="w-4 h-4 md:w-5 md:h-5" />
              티켓
            </button>

            {showTicketDropdown && (
              <div
                ref={ticketDropdownRef}
                className="absolute right-0 mt-1 w-[400px] bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-visible"
              >
                <div className="px-1 py-4 overflow-visible">
                  <div className="max-h-[480px] overflow-visible">
                    <RecentNFTTickets tickets={recentTickets} onQRShowingChange={setIsQRVisible} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {!loading && user ? (
            <div className="relative flex items-center gap-2">
              {gender && (
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden">
                  <img
                    src={gender === 'male' ? '/images/boy_profile.png' : '/images/girl_profile.png'}
                    alt="프로필 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                ref={buttonRef}
                onClick={() => setModalOpen(prev => !prev)}
                className="flex items-center gap-1 text-sm md:text-base font-semibold text-gray-800 underline underline-offset-2 cursor-pointer"
              >
                {getUserDisplayName(user)}님
              </button>
              {modalOpen && typeof window !== 'undefined' && createPortal(
                <div
                  ref={modalRef}
                  className="fixed w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] p-4 space-y-4"
                  style={getPopupPosition()}
                >
                  <div className="font-bold text-gray-800 text-lg">
                    {getUserDisplayName(user)} <span className="text-sm text-gray-500">WELCOME</span>
                  </div>
                  <button onClick={() => {router.push('/mypage'); setModalOpen(false);}} className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-base font-medium text-gray-700 cursor-pointer">
                    마이페이지
                  </button>
                  <button onClick={() => {router.push('/favorites'); setModalOpen(false);}} className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-base font-medium text-gray-700 flex items-center cursor-pointer justify-center gap-2">
                    <span>찜한 콘서트</span>
                    <IoMdHeartEmpty className="w-5 h-5" />
                  </button>
                  <button onClick={() => {handleLogout && handleLogout(); setModalOpen(false);}} className="w-full px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-base font-medium cursor-pointer">
                    로그아웃
                  </button>
                </div>,
                document.body
              )}
            </div>
          ) : (
            !loading && (
              <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm md:text-base font-semibold">
                로그인
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
