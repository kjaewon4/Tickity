'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { UserInfo } from '@/types/auth';
import { createPortal } from 'react-dom';

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
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  
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
  <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-700">
    {/* 로고 */}
    <Link href="/">
      <div className="w-[150px] h-auto flex items-center cursor-pointer">
        <img
          src="/images/Tickity.svg"
          alt="Tickity Logo"
          className="object-contain h-14"
        />
      </div>
    </Link>

    <div className="flex items-center gap-6 relative">
      {/* 검색창 */}
      <form onSubmit={handleSearch} className="relative h-12 w-96 flex justify-end items-center">
        <input
          ref={searchInputRef}
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="콘서트명 또는 가수명을 입력하세요."
          className="
            h-12 w-full pl-4 pr-10 text-base bg-transparent
            border border-gray-300 rounded-full
            outline-none focus:outline-none
          "
        />
        <button
          type="submit"
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            text-gray-600 hover:text-blue-600
            bg-transparent border-none shadow-none w-6 h-6
            flex items-center justify-center cursor-pointer
          "
        >
          <FiSearch size={20} />
        </button>
      </form>

      {/* 네비게이션 메뉴 */}
      <Link href="/" className="text-gray-700 hover:bg-gray-100 px-5 py-2.5 rounded text-base font-semibold">
        Home
      </Link>

      {/* 로그인 or 유저 메뉴 */}
      {!loading && user ? (
        <div className="relative flex items-center space-x-3">
          <span className="text-base text-gray-700">환영합니다,</span>
          <button
            ref={buttonRef}
            onClick={() => setModalOpen(prev => !prev)}
            className="flex items-center gap-1 text-base font-semibold focus:outline-none border-none p-0 m-0"
          >
            <span className="text-base text-gray-800 underline underline-offset-2 cursor-pointer">
              {getUserDisplayName(user)}님
            </span>
          </button>

          {/* 드롭다운 메뉴 */}
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
             className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded text-base font-semibold transition-colors"
          >
            로그인
          </Link>
        )
      )}
    </div>
  </nav>
);
}
export default Navbar;
