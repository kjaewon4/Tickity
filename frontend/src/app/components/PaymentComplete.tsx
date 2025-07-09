'use client';

import React from 'react';
import Image from 'next/image';
import { TicketMintResult } from '@/types/ticket';
import { useRouter } from 'next/navigation';

interface Props {
  result: TicketMintResult;
}

export default function PaymentComplete({ result }: Props) {
  const router = useRouter();

  const handleGoToMain = () => {
    if (typeof window !== 'undefined') {
      if (window.opener && !window.opener.closed) {
        window.opener.location.href = '/';
        window.close();
      } else {
        router.push('/');
      }
    }
  };

  const handleGoToMypage = () => {
    router.push('/mypage');
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4 w-full">
      <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} className="mb-6" />
      <h1 className="text-2xl font-bold text-green-600 mb-4">결제가 완료되었습니다!</h1>
      <p className="mb-2 text-sm">
        좌석 번호: <span className="font-semibold">{result.seat_number}</span>
      </p>

      <div className="mt-6 flex gap-4 justify-center">
        <button
          className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
          onClick={handleGoToMain}
        >
          메인으로 이동
        </button>
        <button
          className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded cursor-pointer"
          onClick={handleGoToMypage}
        >
          마이페이지로 이동
        </button>
      </div>
    </div>
  );
}
