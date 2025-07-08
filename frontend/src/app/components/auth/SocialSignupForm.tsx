import React from 'react';
import { FaUser, FaIdCard } from 'react-icons/fa';

interface SocialSignupFormProps {
  name: string;
  residentNumber: string;
  error: string;
  isSigningUp: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResidentNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSignup: () => void;
}

const SocialSignupForm = ({
  name,
  residentNumber,
  error,
  isSigningUp,
  onNameChange,
  onResidentNumberChange,
  onSignup,
}: SocialSignupFormProps) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full">
      <p className="text-lg text-gray-600 mb-4 text-center">
        이름과 주민번호 7자리를 입력해 주세요
      </p>

      {/* 이름 입력 */}
      <div className="group flex items-center border border-gray-300 rounded px-3 py-3 mb-3">
        <FaUser className="text-gray-400 mr-2 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={onNameChange}
          className="w-full bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400 focus:placeholder-blue-500 transition-colors duration-200"
        />
      </div>

      {/* 주민번호 입력 */}
      <div className="group flex items-center border border-gray-300 rounded px-3 py-3 mb-2">
        <FaIdCard className="text-gray-400 mr-2 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type="text"
          placeholder="주민번호 7자리 (예: 9501013)"
          value={residentNumber}
          onChange={onResidentNumberChange}
          maxLength={7}
          className="w-full bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400 focus:placeholder-blue-500 transition-colors duration-200"
        />
      </div>

      <div className="text-lg text-gray-500 mb-4">
        생년월일 6자리 + 성별 1자리 (예: 9501013)
      </div>

      {/* 회원가입 버튼 */}
      <button
        onClick={onSignup}
        disabled={isSigningUp}
        className={`w-full py-3 rounded-md font-semibold text-white text-lg transition cursor-pointer ${
          isSigningUp
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSigningUp ? '회원가입 중...' : '회원가입'}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 mt-4 text-lg text-center">{error}</div>
      )}
    </div>
  );
};

export default SocialSignupForm;
