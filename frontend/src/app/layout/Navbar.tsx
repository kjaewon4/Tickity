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
      <Link href="/">
        <div className="w-[120px] h-auto cursor-pointer">
          <img src="/images/Tickity.svg" alt="Tickity Logo" className="object-contain" />
        </div>
      </Link>

      <div className="flex items-center gap-4 relative">
        <form onSubmit={handleSearch} className="relative h-10 w-40 flex justify-end items-center">
          <input
            ref={searchInputRef}
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="콘서트명 또는 가수명을 입력하세요."
            className={`
              absolute right-0 h-10 pr-10 pl-4 text-sm bg-white rounded-full
              transition-all duration-300 ease-in-out
              focus:outline-none focus:ring-0
              ${showSearch 
                ? 'w-80 opacity-100 border border-gray-300 shadow-md' 
                : 'w-0 opacity-0 border-none shadow-none'}
            `}
          />
          
          <button
            type="submit"
            onClick={() => setShowSearch(prev => !prev)}
            className={`
              absolute right-2.5 top-1/2 -translate-y-1/2 z-10
              flex items-center justify-center
              transition-all duration-300
              ${showSearch 
                ? 'w-6 h-6 bg-transparent border-none shadow-none text-gray-600' 
                : 'w-10 h-10 bg-white border border-gray-300 shadow-md text-gray-500'}
              rounded-full
            `}
          >
            <FiSearch size={16} />
          </button>
        </form>

        <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
          Home
        </Link>

        {!loading && user ? (
          <div className="relative flex items-center space-x-3">
            <span className="text-sm text-gray-700">환영합니다,</span>
            <button
              ref={buttonRef}
              onClick={() => setModalOpen(prev => !prev)}
              className="flex items-center gap-1 text-sm focus:outline-none focus:ring-0 active:translate-y-0 border-none p-0 m-0"
            >
              <span className="font-semibold text-gray-600 underline underline-offset-2 cursor-pointer">
                {getUserDisplayName(user)}님
              </span>
            </button>

            {modalOpen && typeof window !== 'undefined' && createPortal(
              <div
                ref={modalRef} 
                className="fixed w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] p-4 space-y-3"
                style={{
                  top: getPopupPosition().top,
                  left: getPopupPosition().left,
                }}
              >
                <div className="font-bold text-gray-800">
                  {getUserDisplayName(user)}{' '}
                  <span className="text-xs text-gray-500">WELCOME</span>
                </div>
                <button
                  onClick={() => router.push('/mypage')}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 cursor-pointer"
                >
                  마이페이지
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium cursor-pointer"
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
              className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded text-sm"
            >
              로그인
            </Link>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
