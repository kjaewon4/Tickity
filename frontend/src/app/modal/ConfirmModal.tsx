'use client';

import React from 'react';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full border border-gray-300 focus-within:text-blue-500">
        <p className="text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 cursor-pointer"
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
    </div>
  );
};

export default ConfirmModal;
