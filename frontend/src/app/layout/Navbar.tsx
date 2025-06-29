'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { UserInfo } from '@/types/auth';

const getUserDisplayName = (user: any) =>
  user?.name || user?.email || '사용자';

interface NavbarProps {
  user?: UserInfo | null;
  loading?: boolean;
  handleLogout?: () => void;
}

const Navbar = ({ user, loading = false, handleLogout }: NavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); 
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null); // ✅ 모달 ref 생성

  // ✅ 모달 외부 클릭 시 닫히게
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setModalOpen(false);
      }
    };

    if (modalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalOpen]);

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-700">
      <div className="w-[120px] h-auto">
        <img src="/images/Tickity.svg" alt="Tickity Logo" className="object-contain" />
      </div>

      <div className="flex items-center gap-4 relative">
        <div className="relative h-10 w-40 flex justify-end items-center">
          <input
            type="text"
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
        </div>

        <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
          Home
        </Link>

        {!loading && user ? (
          <div className="relative flex items-center space-x-3">
            <span className="text-sm text-gray-700">환영합니다,</span>
            <button
              onClick={() => setModalOpen(prev => !prev)}
              className="flex items-center gap-1 text-sm focus:outline-none focus:ring-0 active:translate-y-0 border-none p-0 m-0"
            >
              <span className="font-semibold text-gray-600 underline underline-offset-2 cursor-pointer">
                {getUserDisplayName(user)}님
              </span>
            </button>

            {modalOpen && (
              <div
                ref={modalRef} 
                className="absolute top-8 right-0 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-4 space-y-3"
              >
                <div className="font-bold text-gray-800">
                  {getUserDisplayName(user)}{' '}
                  <span className="text-xs text-gray-500">WELCOME</span>
                </div>
                <button
                  onClick={() => router.push('/mypage')}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  마이페이지
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
                >
                  로그아웃
                </button>
              </div>
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
