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
        // 부모 창이 있으면 부모 창을 메인으로 보내고 현재 창 닫기
        window.opener.location.href = '/';
        window.close();
      } else {
        // 부모 창 없으면 현재 창에서 이동
        router.push('/');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center px-4 w-full">
      <Image src="/images/Tickity.svg" alt="로고" width={180} height={50} className="mb-6" />
      <h1 className="text-2xl font-bold text-green-600 mb-4">🎉 결제가 완료되었습니다!</h1>
      <p className="mb-2 text-sm">
        좌석 번호: <span className="font-semibold">{result.seat_number}</span>
      </p>
      <button
        className="mt-6 px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded"
        onClick={handleGoToMain}
      >
        메인으로 이동
      </button>
    </div>
  );
}
