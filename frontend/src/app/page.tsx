'use client';

import { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import { apiClient } from "@/lib/apiClient";
import { UserInfo } from "@/types/auth";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useRouter } from "next/navigation";
import ChatbotModal from "./layout/ChatbotModal";
import { createSimpleConcertUrl, createSeoConcertUrl } from "@/utils/urlUtils";

interface Concert {
  id: string;
  title: string;
  main_performer: string;
  start_date: string;     // ex: '2025-08-23'
  // end_date: string;       // 공연 끝나는 날짜 (넣지말까)
  poster_url: string;
  venue_name: string;
}

const formatStartDate = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') {
    return '날짜 미정';
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return '날짜 오류';
  }
  
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

// 이미지 URL 검증 함수 추가
const isValidImageUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  // example.com이나 유효하지 않은 도메인 필터링
  const invalidDomains = ['example.com', 'placeholder.com', 'dummy.com'];
  try {
    const urlObj = new URL(url);
    return !invalidDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

function SampleNextArrow({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="absolute right-[-4px] top-1/2 transform -translate-y-1/2 z-10 cursor-pointer"
    >
      <div className="bg-white/50 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-white/70 transition">
        <FaChevronRight size={16} />
      </div>
    </div>
  );
}

function SamplePrevArrow({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 z-10 cursor-pointer"
    >
      <div className="bg-white/50 w-8 h-8 rounded-full shadow flex items-center justify-center hover:bg-white/70 transition">
        <FaChevronLeft size={16} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [upcomingConcerts, setUpcomingConcerts] = useState<Concert[]>([]); // 슬라이더용

  const router = useRouter(); 

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);

    if (token) {
      const getUser = async () => {
        try {
          const response = await apiClient.getUserWithToken(token);
          if (response.success && response.data?.user) setUser(response.data.user);
          else localStorage.removeItem('accessToken');
        } catch {
          localStorage.removeItem('accessToken');
        } finally {
          setLoading(false);
        }
      };
      getUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUpcomingConcerts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/upcoming`);
        const data = await res.json();
        if (data.success && data.data?.concerts) {
          setUpcomingConcerts(data.data.concerts); // 슬라이더용
        }
      } catch {
        setUpcomingConcerts([]);
      }
    };

    fetchUpcomingConcerts();
  }, []);


  useEffect(() => {
  const fetchConcerts = async () => {
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/concerts`);
        if (selectedCategory !== '전체') {
          url.searchParams.set('category', selectedCategory);
        }

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.success && data.data?.concerts) {
          setConcerts(data.data.concerts);
        }
      } catch {
        setConcerts([]);
      }
    };

    fetchConcerts();
  }, [selectedCategory]);

  const getUserDisplayName = (user: UserInfo): string => {
    return user.name || user.email || '사용자';
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 4 } },
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ]
  };

  const categories = ['전체', '여자아이돌', '남자아이돌', '솔로 가수', '내한공연', '랩/힙합'];

  return (
    <main className="px-6 pt-30 py-10 bg-white min-h-screen max-w-7xl mx-auto">
    <div className="mb-10 relative -mx-4">
      <Slider {...sliderSettings}>
        {upcomingConcerts.map((concert) => (
        <div
          key={concert.id}
          className="px-4 cursor-pointer"
          onClick={() => router.push(createSeoConcertUrl(concert.title, concert.id))}
        >
          <div className="w-[220px] h-[330px] rounded shadow overflow-hidden bg-white relative">
            {/* 포스터 이미지 전체 영역 차지 */}
            <Image
              src={concert.poster_url?.trim() !== '' ? concert.poster_url : '/images/default-poster.png'}
              alt={concert.title}
              fill
              sizes="220px"
              className="object-cover"
            />

            {/* 아래쪽 불투명 텍스트 오버레이 */}
            <div className="absolute bottom-0 w-full text-white px-3 py-2">
              <div className="text-xl truncate text-shadow font-extrabold">{concert.title}</div>
              <div className="text-xs text-gray-200 text-shadow font-extrabold">{concert.venue_name}</div>
              <div className="text-xs text-gray-200 text-shadow font-extrabold">{formatStartDate(concert.start_date)}</div>
            </div>
          </div>
        </div>
        ))}
      </Slider>
    </div>


      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1 rounded-full text-sm cursor-pointer shadow-md ${
              selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-white text-black'
            }`}
          >
            {category}
          </button>
        ))}
      </div>


    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">콘서트 둘러보기</h2>
      <button
        onClick={() => router.push('/search')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        검색하기
      </button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
        {concerts.map((concert) => (
        <div
          key={concert.id}
          className="px-4 cursor-pointer"
          onClick={() => router.push(createSeoConcertUrl(concert.title, concert.id))}
        >
          <div className="w-[220px]">
            {/* 이미지에만 테두리 */}
            <div className="w-full h-[320px] border border-gray-200 rounded-md overflow-hidden relative">
              <Image
                src={
                  concert.poster_url &&
                  concert.poster_url.trim() !== '' &&
                  isValidImageUrl(concert.poster_url)
                    ? concert.poster_url
                    : '/images/default-poster.png'
                }
                alt={concert.title}
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>

            {/* 텍스트 */}
            <div className="mt-2">
              <div className="text-xl text-gray-900 dark:text-white font-extrabold leading-snug truncate">
                {concert.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-extrabold">{concert.venue_name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-extrabold">
                {formatStartDate(concert.start_date)}
              </div>
            </div>
          </div>
        </div>
        ))}
      </div>

      <ChatbotModal />
    </main>
  );
}
