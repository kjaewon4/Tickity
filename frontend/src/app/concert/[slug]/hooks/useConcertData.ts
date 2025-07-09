import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { extractConcertShortId } from '@/utils/urlUtils';
import {
  Concert,
  SeatPrice,
  CancellationPolicy,
  TicketInfo,
} from '../types';

interface UseConcertDataReturn {
  concert: Concert | null;
  seatPrices: SeatPrice[];
  policies: CancellationPolicy[];
  ticketInfo: TicketInfo | null;
  rounds: { round: number; time: string }[];
  loading: boolean;
  error: string | null;
}

export const useConcertData = (): UseConcertDataReturn => {
  const params = useParams() as { slug?: string | string[] };
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [concert, setConcert] = useState<Concert | null>(null);
  const [seatPrices, setSeatPrices] = useState<SeatPrice[]>([]);
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [rounds, setRounds] = useState<{ round: number; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ticketInfo = useMemo((): TicketInfo | null => {
    if (!concert || !seatPrices.length) return null;

    const minPrice = Math.min(...seatPrices.map((s) => s.price));
    const maxPrice = Math.max(...seatPrices.map((s) => s.price));

    return {
      image: concert.poster_url || '/images/default-poster.png',
      title: concert.title,
      subtitle: `[ ${concert.main_performer} ] IN SEOUL`,
      location: concert.venues?.name || '',
      address: concert.venues?.address || '',
      dateRange: `${concert.start_date}`,
      runtime: concert.running_time,
      price: `${minPrice.toLocaleString()}원 ~ ${maxPrice.toLocaleString()}원`,
      promoter: concert.promoter,
      ageLimit: concert.age_rating,
      contact: concert.customer_service,
      serviceFee: `${concert.booking_fee.toLocaleString()}원`,
    };
  }, [concert, seatPrices]);

  useEffect(() => {
    if (!slug) {
      setError('유효하지 않은 공연 URL입니다.');
      setLoading(false);
      return;
    }

    const fetchConcert = async () => {
      try {
        setLoading(true);

        // 슬러그에서 짧은 ID 추출
        const shortId = extractConcertShortId(slug as string);
        
        if (!shortId) {
          setError('유효하지 않은 공연 URL입니다.');
          setLoading(false);
          return;
        }

        // 짧은 ID로 공연 조회 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${shortId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const json = await res.json();

        if (json.success && json.data) {
          setConcert(json.data.concert);
          setSeatPrices(json.data.seat_prices);
          setPolicies(json.data.cancellation_policies);
          setRounds(json.data.rounds);
        } else {
          setError('공연 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
        } else {
        setError('공연 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConcert();
  }, [slug]);

  return {
    concert,
    seatPrices,
    policies,
    ticketInfo,
    rounds,
    loading,
    error,
  };
};
