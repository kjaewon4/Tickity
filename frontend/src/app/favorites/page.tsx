"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFavoriteConcerts, removeFromFavorites } from '@/utils/favoriteUtils';
import { createSeoConcertUrl } from '@/utils/urlUtils';

interface FavoriteConcert {
  id: string;
  created_at: string;
  concert: {
    id: string;
    title: string;
    main_performer: string;
    date: string;
    poster_url: string;
    organizer: string;
    venue_name: string;
    venue_address: string;
  };
}

const FavoritesPage = () => {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteConcert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 로그인 상태 확인 및 찜한 공연 목록 가져오기
  useEffect(() => {
    const checkLoginAndLoadFavorites = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
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
          setError('로그인이 필요합니다.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setLoading(false);
          return;
        }
        
        const userData = await userResponse.json();
        if (!userData.success || !userData.data?.user) {
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
        setError('찜한 공연 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

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
        setFavorites(prev => prev.filter(fav => fav.concert.id !== concertId));
      } else {
        alert('찜하기 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('찜하기 삭제 오류:', error);
      alert('찜하기 삭제 중 오류가 발생했습니다.');
    }
  };

  if (!isLoggedIn) {
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

  if (error) {
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

        {(!favorites || favorites.length === 0) ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-4">💔</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">아직 찜한 공연이 없습니다</h2>
            <p className="text-gray-600 mb-6">관심 있는 공연을 찜해보세요!</p>
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
              <div
                key={favorite.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img
                    src={favorite.concert.poster_url}
                    alt={favorite.concert.title}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => router.push(createSeoConcertUrl(favorite.concert.title, favorite.concert.id))}
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    찜함
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(favorite.concert.id);
                    }}
                    className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 cursor-pointer"
                      onClick={() => router.push(createSeoConcertUrl(favorite.concert.title, favorite.concert.id))}>
                    {favorite.concert.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {favorite.concert.main_performer}
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>📅 {favorite.concert.date}</div>
                    <div>📍 {favorite.concert.venue_name || '장소 미정'}</div>
                  </div>
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