import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface OneTicketModalProps {
  onClose: () => void;
}

const OneTicketModal: React.FC<OneTicketModalProps> = ({ onClose }) => {
  const [highlight, setHighlight] = useState(false);

  const handleBackdropClick = () => {
    setHighlight(true);
    setTimeout(() => setHighlight(false), 1000); // 깜빡임 지속 시간
  };

  return (
    <AnimatePresence>
      {/* 클릭 감지 가능한 배경 */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-40 bg-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
      />

      {/* 모달 */}
      <motion.div
        key="modal"
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <motion.div
          className={`bg-white rounded-2xl w-[92vw] max-w-lg p-8 relative shadow-2xl border ${
            highlight ? 'animate-modal-pulse' : 'border-gray-300'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* X 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-500 hover:text-gray-700 text-2xl"
          >
            <IoClose />
          </button>

          {/* 내용 */}
          <h3 className="text-2xl font-bold mb-6 text-center">알림</h3>
          <p className="text-base text-gray-700 text-center leading-relaxed">
            해당 콘서트는{' '}
            <span className="text-red-500 font-bold">1인 1매</span>만 예매 가능합니다.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OneTicketModal;
