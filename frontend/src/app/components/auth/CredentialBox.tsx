'use client';
import { FaUser, FaLock } from 'react-icons/fa';
import { HiOutlineEye } from 'react-icons/hi2';

interface Props {
  email: string;
  password: string;
  showPassword: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
}

export default function CredentialBox({
  email,
  password,
  showPassword,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
}: Props) {
  return (
    <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl overflow-hidden shadow shadow-gray-200">
    {/* 아이디 입력 */}
    <div className="group flex items-center px-5 py-4 transition-colors duration-150">
        <FaUser className="text-gray-400 text-[18px] mr-3 group-focus-within:text-blue-500" />
        <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={onEmailChange}
        className="flex-1 outline-none bg-transparent text-base placeholder:text-gray-400 group-focus-within:placeholder:text-blue-500"
        />
    </div>

    <div className="h-px bg-gray-200 mx-5" />

    {/* 비밀번호 입력 */}
    <div className="group flex items-center px-5 py-4 transition-colors duration-150">
        <FaLock className="text-gray-400 text-[18px] mr-3 group-focus-within:text-blue-500" />
        <input
        type={showPassword ? 'text' : 'password'}
        placeholder="비밀번호"
        value={password}
        onChange={onPasswordChange}
        className="flex-1 outline-none bg-transparent text-base placeholder:text-gray-400 group-focus-within:placeholder:text-blue-500"
        />
        <HiOutlineEye
        onClick={onTogglePassword}
        className="text-gray-400 text-[18px] cursor-pointer group-focus-within:text-blue-500"
        />
    </div>
    </div>
  );
}
