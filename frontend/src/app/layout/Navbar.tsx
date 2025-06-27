'use client';
import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import '../globals.css';

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
      {/* 로고 */}
      <div className="w-[120px] h-auto">
        <img src="../images/Tickity.svg" alt="Tickity Logo" className="object-contain" />
      </div>

      {/* 메뉴 */}
      <div className="flex items-center gap-6">
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

        {/* 로그인 / 회원가입 */}
        <button className="text-gray-700 hover:bg-gray-100 px-4 py-2 rounded cursor-pointer">로그인</button>
        <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded border-none cursor-pointer">
          회원가입
        </button>
      </div>
    </nav>
  );
};

export default Navbar;