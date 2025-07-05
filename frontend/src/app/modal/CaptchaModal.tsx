'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BiRefresh } from 'react-icons/bi';           
import { HiSpeakerWave } from 'react-icons/hi2'

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

const CaptchaModal: React.FC<Props> = ({ onSuccess, onClose }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 랜덤 문자열 생성
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    return text;
  };

  // 캔버스에 문자 그리기
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '36px Arial';
    ctx.fillStyle = 'black';

    for (let i = 0; i < text.length; i++) {
      const x = 20 + i * 30;
      const y = 40 + Math.random() * 5;
      ctx.fillText(text[i], x, y);
    }
  };

  useEffect(() => {
    const newText = generateCaptcha();
    drawCaptcha(newText);
  }, []);

  const handleRefresh = () => {
    const newText = generateCaptcha();
    drawCaptcha(newText);
    setInputValue('');
    setError('');
  };

  const handleSubmit = () => {
    if (inputValue.toUpperCase() === captchaText.toUpperCase()) {
      onSuccess();
    } else {
      setError('보안문자가 일치하지 않습니다.');
    }
  };

  // ✅ 음성 읽기 함수
  const readCaptcha = () => {
    if (!captchaText) return;

    const utterance = new SpeechSynthesisUtterance(
      captchaText.split('').join(' ') // 예: "W W V F K C"
    );
    utterance.lang = 'en-US';   // 영어 알파벳 발음
    utterance.rate = 0.8;       
    speechSynthesis.speak(utterance);
  };

  return (
    <>
    <div className="fixed inset-0 z-40 bg-transparent pointer-events-auto" />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-xl w-[380px]">
          <h2 className="text-blue-500 text-xl font-bold text-center mb-2">인증예매</h2>
          <p className="text-sm text-center text-gray-600 mb-4">
            부정예매 방지를 위해 보안문자를 정확히 입력해주세요.
          </p>

          <div className="flex items-center justify-between border rounded px-2 py-1 bg-white border-gray-300">
            <canvas ref={canvasRef} width={200} height={60} />
                <div className="flex flex-col items-center gap-1 ml-2">
                <button
                    onClick={handleRefresh}
                    title="새로고침"
                    className="text-gray-500 hover:text-black text-[22px] cursor-pointer"
                >
                    <BiRefresh />
                </button>

                <button
                    onClick={readCaptcha}
                    title="음성 안내"
                    className="text-gray-500 hover:text-black text-[22px] cursor-pointer"
                >
                    <HiSpeakerWave />
                </button>
                </div>
          </div>

          <input
            className="mt-3 border border-gray-300 rounded px-3 py-2 w-full"
            placeholder="대소문자 구분없이 문자입력"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white mt-4 px-4 py-2 rounded w-full cursor-pointer"
          >
            입력완료
          </button>
            <p
            className="text-center mt-3 text-blue-500 text-sm underline cursor-pointer"
            onClick={onClose} 
            >
            좌석 먼저 확인하고 나중에 입력하기
            </p>
        </div>
      </div>
    </>
  );
};

export default CaptchaModal;
