'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { IoTicketOutline } from "react-icons/io5";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserInfo } from '@/types/auth';
import { createPortal } from 'react-dom';
import { IoMdHeartEmpty } from "react-icons/io";
import apiClient from '@/lib/apiClient';
import { parseResidentNumber } from '@/utils/userUtils';


const getUserDisplayName = (user: any) =>
  user?.name || user?.email || '사용자';

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
  const router = useRouter();
  const pathname = usePathname();
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchResidentNumber = async () => {
      try {
        const res = await apiClient.getResidentNumber(user!.id);
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

    if (user?.id) {
      fetchResidentNumber();
    }
  }, [user]);
  
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setModalOpen(false);
    }
  };

  if (modalOpen) {
    document.addEventListener('click', handleClickOutside); 
  }

  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, [modalOpen]);

  // 페이지 이동 시 드롭다운 닫기
  useEffect(() => {
    setModalOpen(false);
  }, [pathname]);

  // 팝업 위치 계산
  const getPopupPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 240, 
      };
    }
    return { top: 0, left: 0 };
  };

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchKeyword.trim())}`);
      setShowSearch(false);
      setSearchKeyword('');
    }
  };

  // 검색창 열기 시 포커스
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

return (
<nav className="fixed top-0 left-0 w-full z-50 flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-8 py-4 border-b border-gray-200 bg-white">
  {/* 로고 */}
  <Link href="/">
    <div className="w-[120px] md:w-[150px] flex items-center cursor-pointer">
      <img
        src="/images/Tickity.svg"
        alt="Tickity Logo"
        className="object-contain h-12 md:h-14"
      />
    </div>
  </Link>

  {/* 오른쪽 요소 */}
  <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto md:flex-1 md:justify-end gap-2 md:gap-3 relative">
    {/* 검색창 */}
    <form
      onSubmit={handleSearch}
      className="relative h-10 w-full md:max-w-sm lg:max-w-md flex items-center order-first md:order-none"
    >
      <input
        ref={searchInputRef}
        type="text"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        placeholder="콘서트명 또는 가수명을 입력하세요."
        className="h-full w-full pl-4 pr-10 text-sm md:text-base border border-gray-300 rounded-full outline-none"
      />
      <button
        type="submit"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600"
      >
        <FiSearch size={18} />
      </button>
    </form>

    {/* 메뉴 및 로그인/유저 메뉴 */}
    <div className="flex items-center flex-wrap md:flex-nowrap justify-center md:justify-end gap-2 whitespace-nowrap"> 
      <Link
        href="/"
        className="text-gray-700 hover:bg-gray-100 px-2.5 py-2 rounded text-sm md:text-base font-semibold"
      >
        Home
      </Link>

      <Link
        href="/tickets"
        className="flex items-center gap-1 text-gray-700 hover:bg-gray-100 px-2.5 py-2 rounded text-sm md:text-base font-semibold"
      >
        <IoTicketOutline className="w-4 h-4 md:w-5 md:h-5" />
        티켓
      </Link>

      {/* 로그인 or 유저 메뉴 */}
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
            className="flex items-center gap-1 text-sm md:text-base font-semibold text-gray-800 underline underline-offset-2"
          >
            {getUserDisplayName(user)}님
          </button>

          {/* 드롭다운 */}
          {modalOpen && typeof window !== 'undefined' && createPortal(
            <div
              ref={modalRef}
              className="fixed w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] p-4 space-y-4"
              style={getPopupPosition()}
            >
              <div className="font-bold text-gray-800 text-lg">
                {getUserDisplayName(user)}{' '}
                <span className="text-sm text-gray-500">WELCOME</span>
              </div>
              <button
                onClick={() => router.push('/mypage')}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-base font-medium text-gray-700"
              >
                마이페이지
              </button>
              <button
                onClick={() => router.push('/favorites')}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-base font-medium text-gray-700"
              >
                찜한 콘서트
                <IoMdHeartEmpty className='w-5 h-5 ml-2' />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-base font-medium"
              >
                로그아웃
              </button>
            </div>,
            document.body
          )}
        </div>
      ) : (
        !loading && (
          <Link
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm md:text-base font-semibold"
          >
            로그인
          </Link>
        )
      )}
    </div>
  </div>
</nav>

);
}
export default Navbar;
