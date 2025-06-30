// 찜하기 관련 유틸리티 함수들

/**
 * 찜하기 추가
 * @param concertId 공연 ID
 * @param userId 사용자 ID
 * @returns API 응답
 */
export const addToFavorites = async (concertId: string, userId: string) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ concert_id: concertId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('찜하기 추가 오류:', error);
    throw error;
  }
};

/**
 * 찜하기 삭제
 * @param concertId 공연 ID
 * @param userId 사용자 ID
 * @returns API 응답
 */
export const removeFromFavorites = async (concertId: string, userId: string) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-favorites/${concertId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('찜하기 삭제 오류:', error);
    throw error;
  }
};

/**
 * 찜하기 상태 확인
 * @param concertId 공연 ID
 * @param userId 사용자 ID
 * @returns 찜하기 상태
 */
export const checkFavoriteStatus = async (concertId: string, userId: string) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/user-favorites/check/${concertId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('찜하기 상태 확인 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 찜한 공연 목록 조회
 * @param userId 사용자 ID
 * @returns 찜한 공연 목록
 */
export const getFavoriteConcerts = async (userId: string) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-favorites`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('찜한 공연 목록 조회 오류:', error);
    throw error;
  }
}; 