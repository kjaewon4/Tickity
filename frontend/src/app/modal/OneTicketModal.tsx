import React from 'react';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface OneTicketModalProps {
  onClose: () => void;
}

const OneTicketModal: React.FC<OneTicketModalProps> = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}   
        animate={{ opacity: 1, scale: 1, y: 0 }}        
        exit={{ opacity: 0, scale: 0.95, y: 30 }}       
        transition={{ duration: 0.3, ease: 'easeOut' }} 
      >
        <div className="bg-white rounded-xl shadow-xl w-[90vw] max-w-sm p-6 relative border border-gray-300">
          {/* X 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          >
            <IoClose />
          </button>

          {/* 내용 */}
          <h3 className="text-lg font-semibold mb-4 text-center">알림</h3>
          <p className="text-sm text-gray-700 text-center">
            해당 콘서트는 <span className="text-red-500 font-semibold">1인 1매</span>만 예매 가능합니다.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OneTicketModal;
