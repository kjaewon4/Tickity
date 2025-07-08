import React from 'react';
import { FaUser, FaEnvelope, FaIdCard, FaLock } from 'react-icons/fa';

interface GeneralSignupFormProps {
  name: string;
  email: string;
  password: string;
  passwordCheck: string;
  residentNumber: string;
  emailStatus: 'idle' | 'checking' | 'available' | 'taken' | 'error';
  emailMessage: string;
  error: string;
  isSigningUp: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordCheckChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResidentNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailCheck: () => void;
  onSignup: () => void;
  getEmailInputClass: () => string;
  getEmailMessageClass: () => string;
}

const GeneralSignupForm = ({
  name,
  email,
  password,
  passwordCheck,
  residentNumber,
  emailStatus,
  emailMessage,
  error,
  isSigningUp,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordCheckChange,
  onResidentNumberChange,
  onEmailCheck,
  onSignup,
  getEmailInputClass,
  getEmailMessageClass,
}: GeneralSignupFormProps) => {
  return (
    <div className="bg-white p-6 w-full">
      <p className="text-lg text-gray-600 mb-4 text-center">
        이메일을 입력하고 확인 버튼을 눌러주세요
      </p>

      {/* 이름 */}
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

      {/* 이메일 + 확인 버튼 */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <div className="group flex items-center border border-gray-300 rounded px-3 py-3 w-full">
            <FaEnvelope className="text-gray-400 mr-2 transition-colors duration-200 group-focus-within:text-blue-500" />
            <input
              type="email"
              placeholder="이메일"
              className="w-full bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400 focus:placeholder-blue-500 transition-colors duration-200"
              value={email}
              onChange={onEmailChange}
            />
            {emailStatus === 'checking' && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
            )}
            {emailStatus === 'available' && <div className="ml-2">✅</div>}
            {emailStatus === 'taken' && <div className="ml-2">❌</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={onEmailCheck}
          disabled={!email || emailStatus === 'checking'}
          className={`px-4 py-3 rounded font-medium whitespace-nowrap text-lg cursor-pointer ${
            !email || emailStatus === 'checking'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {emailStatus === 'checking' ? '확인 중...' : '확인'}
        </button>
      </div>

      {emailMessage && (
        <div className={`${getEmailMessageClass()} mb-3`}>{emailMessage}</div>
      )}

      {/* 주민번호 */}
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

      {/* 비밀번호 */}
      <div className="group flex items-center border border-gray-300 rounded px-3 py-3 mb-3">
        <FaLock className="text-gray-400 mr-2 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={onPasswordChange}
          className="w-full bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400 focus:placeholder-blue-500 transition-colors duration-200"
        />
      </div>

      {/* 비밀번호 확인 */}
      <div className="group flex items-center border border-gray-300 rounded px-3 py-3 mb-4">
        <FaLock className="text-gray-400 mr-2 transition-colors duration-200 group-focus-within:text-blue-500" />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordCheck}
          onChange={onPasswordCheckChange}
          className="w-full bg-transparent outline-none text-gray-800 text-lg placeholder-gray-400 focus:placeholder-blue-500 transition-colors duration-200"
        />
      </div>

      {/* 회원가입 버튼 */}
      <button
        onClick={onSignup}
        disabled={isSigningUp || emailStatus !== 'available'}
        className={`w-full py-3 rounded-xl font-semibold text-white transition text-lg cursor-pointer ${
          isSigningUp || emailStatus !== 'available'
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSigningUp ? '회원가입 중...' : '회원가입'}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-red-500 mt-4 text-lg text-center">
          {error}
          {error.includes('rate limit') && (
            <div className="text-lg mt-1 text-gray-600">
              <p>• 다른 이메일 주소로 시도해보세요</p>
              <p>• 1~2분 후 다시 시도해보세요</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneralSignupForm;
