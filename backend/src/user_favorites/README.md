# 찜하기 API 문서

## 개요
사용자가 공연을 찜하고, 마이페이지에서 찜한 공연 목록을 조회할 수 있는 API입니다.

## 인증
모든 엔드포인트는 JWT 토큰 인증이 필요합니다.
```
Authorization: Bearer <your-jwt-token>
```

## API 엔드포인트

### 1. 찜하기 추가
**POST** `/user-favorites`

공연을 찜하기에 추가합니다.

**Request Body:**
```json
{
  "concert_id": "uuid-string"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "concert_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "공연을 찜했습니다."
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "이미 찜한 공연입니다."
}
```

### 2. 찜하기 삭제
**DELETE** `/user-favorites/:concertId`

찜하기에서 공연을 삭제합니다.

**Response (200):**
```json
{
  "success": true,
  "message": "찜하기가 삭제되었습니다."
}
```

### 3. 내가 찜한 공연 목록 조회
**GET** `/user-favorites`

현재 사용자가 찜한 모든 공연 목록을 조회합니다.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "concert_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "concert": {
        "id": "uuid",
        "title": "공연 제목",
        "date": "2024-01-01T00:00:00Z",
        "poster_url": "https://example.com/poster.jpg",
        "organizer": "주최사",
        "main_performer": "주연",
        "venue_name": "공연장 이름",
        "venue_address": "공연장 주소"
      }
    }
  ],
  "message": "찜한 공연 목록을 조회했습니다."
}
```

### 4. 찜하기 상태 확인
**GET** `/user-favorites/check/:concertId`

특정 공연의 찜하기 상태를 확인합니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  },
  "message": "찜하기 상태를 확인했습니다."
}
```

### 5. 찜하기 토글
**POST** `/user-favorites/toggle/:concertId`

찜하기 상태를 토글합니다. (찜한 상태면 삭제, 안 찜한 상태면 추가)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  },
  "message": "공연을 찜했습니다."
}
```

## 사용 예시

### JavaScript/TypeScript
```javascript
// 찜하기 추가
const addToFavorites = async (concertId) => {
  const response = await fetch('/user-favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ concert_id: concertId })
  });
  return response.json();
};

// 찜한 공연 목록 조회
const getFavorites = async () => {
  const response = await fetch('/user-favorites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// 찜하기 토글
const toggleFavorite = async (concertId) => {
  const response = await fetch(`/user-favorites/toggle/${concertId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### React Hook 예시
```javascript
import { useState, useEffect } from 'react';

const useFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/user-favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error('찜한 공연 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (concertId) => {
    try {
      const response = await fetch(`/user-favorites/toggle/${concertId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // 목록 새로고침
        fetchFavorites();
      }
    } catch (error) {
      console.error('찜하기 토글 실패:', error);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return { favorites, loading, toggleFavorite, refetch: fetchFavorites };
};
```

## 에러 처리

모든 API는 다음과 같은 에러 응답을 반환할 수 있습니다:

- **400 Bad Request**: 잘못된 요청 (이미 찜한 공연, 존재하지 않는 공연 등)
- **401 Unauthorized**: 인증 토큰이 없거나 유효하지 않음
- **500 Internal Server Error**: 서버 내부 오류

## 주의사항

1. 모든 요청에는 유효한 JWT 토큰이 필요합니다.
2. 사용자는 본인의 찜하기만 조회/수정할 수 있습니다.
3. 존재하지 않는 공연 ID로 요청하면 에러가 발생합니다.
4. 이미 찜한 공연을 다시 찜하려고 하면 에러가 발생합니다. 