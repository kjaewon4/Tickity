'use client';

import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import Link from 'next/link';

const getUserDisplayName = (user: any) => user?.name || '사용자';

interface NavbarProps {
  user?: any;
  loading?: boolean;
  handleLogout?: () => void;
}

const Navbar = ({ user, loading = false, handleLogout }: NavbarProps) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 dark:border-gray-700">
      {/* 로고 */}
      <div className="w-[120px] h-auto">
        <img src="/images/Tickity.svg" alt="Tickity Logo" className="object-contain" />
      </div>

      {/* 우측 메뉴 */}
      <div className="flex items-center gap-4">
        {/* 검색창 */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="콘서트명 또는 가수명을 입력하세요."
            className={`transition-all duration-300 border border-gray-300 px-2 py-1 rounded text-sm mr-2 focus:outline-none focus:border-[#3B82F6] ${
              showSearch ? 'w-80 opacity-100' : 'w-0 opacity-0'
            }`}
          />
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="text-gray-400 hover:text-gray-600 text-xl border-none focus:outline-none cursor-pointer"
          >
            <FiSearch />
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <Link
          href="/"
          className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Home
        </Link>
        <Link
          href="/chatbot"
          className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          챗봇 💬
        </Link>

        {/* 로그인 / 로그아웃 */}
        {!loading && (
          user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {getUserDisplayName(user)}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded text-sm"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded text-sm"
              >
                회원가입
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
};

export default Navbar;
