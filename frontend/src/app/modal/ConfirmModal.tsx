'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
      />

      <motion.div
        key="modal"
        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-gray-300 cursor-pointer">
          <div className="text-sm mb-4">{message}</div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              onClick={onCancel}
            >
              취소
            </button>
            <button
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
              onClick={onConfirm}
            >
              확인
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
