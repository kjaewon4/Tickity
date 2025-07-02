"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavoriteConcerts, removeFromFavorites } from '@/utils/favoriteUtils';
import { createSeoConcertUrl } from '@/utils/urlUtils';
import LazyImage from '@/components/LazyImage';

interface FavoriteConcert {
  id: string;
  created_at: string;
  concerts: {
    id: string;
    title: string;
    main_performer: string;
    start_date: string;
    start_time: string;
    poster_url: string;
    category: string;
    venues: {
      name: string;
    };
  };
}

const FavoritesPage = () => {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteConcert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null: 확인 중, true: 로그인됨, false: 로그인 안됨
  const [userId, setUserId] = useState<string | null>(null);

  // 로그인 상태 확인 및 찜한 공연 목록 가져오기
  useEffect(() => {
    const checkLoginAndLoadFavorites = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setIsLoggedIn(false);
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        // 토큰으로 사용자 정보 조회
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          setIsLoggedIn(false);
          setError('로그인이 필요합니다.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
        if (!userData.success || !userData.data?.user) {
          setIsLoggedIn(false);
          setError('로그인이 필요합니다.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setLoading(false);
          return;
        }
        
        const currentUserId = userData.data.user.id;
        setIsLoggedIn(true);
        setUserId(currentUserId);
        
        // 찜한 공연 목록 가져오기
        const favoritesResponse = await getFavoriteConcerts(currentUserId);
        console.log('찜한 공연 응답:', favoritesResponse);
        if (favoritesResponse.success) {
          // 응답 구조에 따라 배열 설정
          const favoritesData = favoritesResponse.data || [];
          setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
        } else {
          setError('찜한 공연 목록을 불러오는데 실패했습니다.');
          setFavorites([]);
        }
      } catch (error) {
        console.error('찜한 공연 목록 로드 오류:', error);
        setIsLoggedIn(false);
        setError('로그인이 필요합니다.');
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    // 즉시 실행
    checkLoginAndLoadFavorites();
  }, []);

  const handleRemoveFavorite = async (concertId: string) => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // 토큰으로 사용자 정보 조회
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userResponse.ok) {
        alert('로그인이 필요합니다.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUserId(null);
        return;
      }
      
      const userData = await userResponse.json();
      if (!userData.success || !userData.data?.user) {
        alert('로그인이 필요합니다.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUserId(null);
        return;
      }
      
      const currentUserId = userData.data.user.id;
      
      const response = await removeFromFavorites(concertId, currentUserId);
      if (response.success) {
        // 목록에서 제거
        setFavorites(prev => prev.filter(fav => fav.concerts.id !== concertId));
      } else {
        alert('찜하기 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('찜하기 삭제 오류:', error);
      alert('찜하기 삭제 중 오류가 발생했습니다.');
    }
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">찜한 공연 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">찜한 공연을 보려면 로그인해주세요.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 오류가 발생한 경우
  if (error && isLoggedIn !== true) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">찜한 공연</h1>
          <p className="text-gray-600">
            {favorites?.length || 0}개의 공연을 찜했습니다
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">아직 찜한 공연이 없습니다</h3>
            <p className="text-gray-500 mb-6">관심 있는 공연을 찜해보세요!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              공연 둘러보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <LazyImage
                    src={favorite.concerts.poster_url || '/images/default-poster.png'}
                    alt={favorite.concerts.title}
                    fill
                    className="object-cover"
                    quality={70}
                    priority={false}
                    imageSize="small"
                  />
                  <button
                    onClick={() => handleRemoveFavorite(favorite.concerts.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
                    title="찜하기 삭제"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {favorite.concerts.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {favorite.concerts.main_performer}
                  </p>
                  <p className="text-gray-500 text-sm mb-2">
                    {favorite.concerts.venues?.name || '장소 미정'}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    {new Date(favorite.concerts.start_date).toLocaleDateString('ko-KR')} {favorite.concerts.start_time}
                  </p>
                  <button
                    onClick={() => router.push(createSeoConcertUrl(favorite.concerts.title, favorite.concerts.id))}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage; 