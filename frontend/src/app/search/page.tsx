'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createSeoConcertUrl } from '@/utils/urlUtils';
import LazyImage from '@/components/LazyImage';
import { isValidImageUrl } from '@/utils/imageOptimization';

interface Concert {
  id: string;
  title: string;
  main_performer: string;
  start_date: string;
  poster_url: string;
  venue_name: string;
  category: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '전체';

  useEffect(() => {
    setSelectedCategory(categoryParam);
    // 검색어가 없어도 API 호출하여 전체 콘서트 표시
    fetchSearchResults(query, categoryParam);
  }, [query, categoryParam]);

  const fetchSearchResults = async (keyword: string, category: string = selectedCategory) => {
    try {
      setLoading(true);
      
      // 검색 API 호출
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/concerts/search`);
      url.searchParams.set('q', keyword);
      if (category !== '전체') {
        url.searchParams.set('category', category);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success && data.data?.concerts) {
        setConcerts(data.data.concerts);
      } else {
        setConcerts([]);
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setConcerts([]);
    } finally {
      setLoading(false);
    }
  };



  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    if (category !== '전체') {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    router.push(url.toString());
  };

  const categories = ['전체', '여자아이돌', '남자아이돌', '솔로 가수', '내한공연', '랩/힙합'];

  const formatStartDate = (dateString: string): string => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            콘서트 검색
          </h1>
          
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-1 border rounded-full text-sm transition-colors ${
                  selectedCategory === category 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 결과 */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">검색 중...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {query ? '검색 결과' : '전체 콘서트'}
                  {query && (
                    <span className="text-blue-600 ml-2">
                      "{query}" ({concerts.length}개)
                    </span>
                  )}
                  {!query && (
                    <span className="text-blue-600 ml-2">
                      ({concerts.length}개)
                    </span>
                  )}
                </h2>
              </div>

              {concerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 mb-2">
                    {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '등록된 콘서트가 없습니다.'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {query ? '다른 키워드로 검색해보세요.' : '새로운 콘서트가 등록될 때까지 기다려주세요.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {concerts.map((concert) => (
                    <div
                      key={concert.id}
                      onClick={() => router.push(createSeoConcertUrl(concert.title, concert.id))}
                      className="cursor-pointer"
                    >
                      <div className="relative h-48">
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
                          className="object-cover"
                          quality={70}
                          priority={false}
                          imageSize="small"
                        />
                      </div>
                      <div className="mt-2">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                          {concert.title}
                        </h3>
                        <p className="text-gray-600 text-xs mb-1">
                          {concert.main_performer}
                        </p>
                        <p className="text-gray-500 text-xs mb-1">
                          {concert.venue_name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {formatStartDate(concert.start_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 