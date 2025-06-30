"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createConcertUrl } from '@/utils/urlUtils';

const ReservationRedirect = () => {
  const { concertId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (concertId) {
      // 임시로 제목을 가져오기 위해 API 호출
      const fetchConcertAndRedirect = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}`);
          const json = await res.json();
          
          if (json.success && json.data?.concert) {
            const newUrl = createConcertUrl(concertId as string, json.data.concert.title);
            router.replace(newUrl);
          } else {
            // 콘서트 정보를 가져올 수 없는 경우 기본 URL로 리다이렉트
            router.replace(`/concert/${concertId}`);
          }
        } catch (error) {
          // 에러 발생 시 기본 URL로 리다이렉트
          router.replace(`/concert/${concertId}`);
        }
      };

      fetchConcertAndRedirect();
    }
  }, [concertId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 이동하고 있습니다...</p>
      </div>
    </div>
  );
};

export default ReservationRedirect;
