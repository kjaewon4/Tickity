'use client';

import { useEffect, useState } from "react";
import Slider from "react-slick";
import { apiClient } from "@/lib/apiClient";
import { UserInfo } from "@/types/auth";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useRouter } from "next/navigation";
import ChatbotModal from "./layout/ChatbotModal";
import { createSeoConcertUrl } from "@/utils/urlUtils";
import LazyImage from "@/components/LazyImage";
import { isValidImageUrl } from "@/utils/imageOptimization";

interface Concert {
  id: string;
  title: string;
  main_performer: string;
  start_date: string;
  poster_url: string;
  venue_name: string;
}

const formatStartDate = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '날짜 미정';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '날짜 오류';
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
};

function SampleNextArrow({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="absolute right-[-12px] top-1/2 transform -translate-y-1/2 z-10 cursor-pointer"
    >
      <div className="bg-white/50 w-10 h-10 rounded-full shadow flex items-center justify-center hover:bg-white/70 transition">
        <FaChevronRight size={20} />
      </div>
    </div>
  );
}

function SamplePrevArrow({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="absolute left-[-12px] top-1/2 transform -translate-y-1/2 z-10 cursor-pointer"
    >
      <div className="bg-white/50 w-10 h-10 rounded-full shadow flex items-center justify-center hover:bg-white/70 transition">
        <FaChevronLeft size={20} />
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
  const [upcomingConcerts, setUpcomingConcerts] = useState<Concert[]>([]);
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
          setUpcomingConcerts(data.data.concerts);
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
    <main className="px-4 pt-20 pb-10 bg-white min-h-screen w-full max-w-[1700px] mx-auto">
      <div className="mb-10 relative px-2">
        <Slider {...sliderSettings} className="-mx-[6px]">
          {upcomingConcerts.map((concert) => (
            <div
              key={concert.id}
              className="w-[260px] px-[6px] cursor-pointer"
              onClick={() => router.push(createSeoConcertUrl(concert.title, concert.id))}
            >
              <div className="h-[400px] rounded-xl shadow overflow-hidden bg-white relative">
                <LazyImage
                  src={concert.poster_url?.trim() !== '' ? concert.poster_url : '/images/default-poster.png'}
                  alt={concert.title}
                  fill
                  sizes="260px"
                  className="object-cover"
                  quality={70}
                  priority={true}
                  imageSize="small"
                />
                <div className="absolute bottom-0 w-full text-white px-3 py-2">
                  <div className="text-2xl truncate text-shadow font-extrabold">{concert.title}</div>
                  <div className="text-sm text-gray-200 text-shadow font-bold">{concert.venue_name}</div>
                  <div className="text-sm text-gray-200 text-shadow font-bold">
                    {formatStartDate(concert.start_date)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <div className="px-2">
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full text-base font-semibold cursor-pointer shadow-lg transition-all border border-gray-300 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-black hover:bg-blue-500 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>


        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">콘서트 둘러보기</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {concerts.map((concert) => (
            <div
              key={concert.id}
              className="cursor-pointer"
              onClick={() => router.push(createSeoConcertUrl(concert.title, concert.id))}
            >
              <div className="h-[400px] rounded-xl shadow overflow-hidden bg-white relative">
                <LazyImage
                  src={
                    concert.poster_url &&
                    concert.poster_url.trim() !== '' &&
                    isValidImageUrl(concert.poster_url)
                      ? concert.poster_url
                      : '/images/default-poster.png'
                  }
                  alt={concert.title}
                  fill
                  sizes="300px"
                  className="object-cover"
                  quality={70}
                  priority={false}
                  imageSize="small"
                />
              </div>
              <div className="mt-2 px-1">
                <div className="text-2xl text-gray-900 dark:text-white font-extrabold leading-snug truncate">
                  {concert.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-bold">{concert.venue_name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-bold">
                  {formatStartDate(concert.start_date)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatbotModal />
    </main>
  );
}
