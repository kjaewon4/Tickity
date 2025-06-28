'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCommentDots, FaTimes } from 'react-icons/fa';
import Chatbot from '@/app/chatbot/page';

export default function ChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* 말풍선 / 닫기 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
      >
        {isOpen ? <FaTimes size={20} /> : <FaCommentDots size={20} />}
      </button>

      {/* 챗봇 모달 */}
      {isOpen && (
        <div
          ref={modalRef}
          className="fixed bottom-20 right-6 z-50 w-[520px] h-[600px] bg-white rounded-xl shadow-xl p-4"
        >
          <div className="h-full overflow-y-auto">
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
}
