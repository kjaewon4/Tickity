import { useState, useEffect } from 'react';
import { addToFavorites, removeFromFavorites, checkFavoriteStatus } from '@/utils/favoriteUtils';
import { Concert } from '../types';

interface UseFavoriteReturn {
  liked: boolean;
  favoriteLoading: boolean;
  handleFavoriteToggle: () => Promise<void>;
}

export const useFavorite = (concert: Concert | null, userId: string | null): UseFavoriteReturn => {
  const [liked, setLiked] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 찜하기 상태 확인 (지연 로딩)
  useEffect(() => {
    const checkFavoriteStatusAsync = async () => {
      if (!userId || !concert) return;

      // 찜하기 상태는 나중에 확인 (성능 최적화)
      setTimeout(async () => {
      try {
        const response = await checkFavoriteStatus(concert.id, userId);
        if (response.success) {
          setLiked(response.data.isFavorited);
        }
      } catch (error) {
        console.error('찜하기 상태 확인 오류:', error);
      }
      }, 2000); // 2초 지연
    };

    checkFavoriteStatusAsync();
  }, [concert, userId]);

  const handleFavoriteToggle = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!userId || !concert) {
      alert('로그인이 필요합니다.');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (liked) {
        // 찜하기 삭제
        const response = await removeFromFavorites(concert.id, userId);
        if (response.success) {
          setLiked(false);
        } else {
          alert('찜하기 삭제에 실패했습니다.');
        }
      } else {
        // 찜하기 추가
        const response = await addToFavorites(concert.id, userId);
        if (response.success) {
          setLiked(true);
        } else {
          alert('찜하기 추가에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('찜하기 토글 오류:', error);
      alert('찜하기 처리 중 오류가 발생했습니다.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  return {
    liked,
    favoriteLoading,
    handleFavoriteToggle
  };
}; 