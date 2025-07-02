// 이미지 최적화 유틸리티

// Supabase Storage URL 최적화
const optimizeSupabaseImage = (
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
): string => {
  if (!url || typeof url !== 'string' || url.trim() === '' || !url.includes('supabase.co/storage')) {
    return url;
  }

  // 이미 transform 파라미터가 있으면 그대로 반환
  if (url.includes('transform=')) {
    return url;
  }

  const { width = 400, height = 400, quality = 75, format = 'webp' } = options;

  const transform = {
    width,
    height,
    resize: 'cover',
    quality,
    format
  };

  return `${url}?transform=${encodeURIComponent(JSON.stringify(transform))}`;
};

// 이미지 URL 유효성 검사 (공통 유틸리티)
export const isValidImageUrl = (url: string): boolean => {
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

// 이미지 크기별 최적화 설정 (LazyImage에서 사용)
export const getOptimizedImageUrl = (
  url: string,
  size: 'thumbnail' | 'small' | 'medium' | 'large' | 'original'
): string => {
  // 빈 문자열이나 null/undefined 체크
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/images/default-poster.png';
  }

  const sizeConfigs = {
    thumbnail: { width: 100, height: 100, quality: 60 },
    small: { width: 200, height: 200, quality: 70 },
    medium: { width: 400, height: 400, quality: 75 },
    large: { width: 800, height: 800, quality: 80 },
    original: { width: 1200, height: 1200, quality: 85 }
  };

  return optimizeSupabaseImage(url, sizeConfigs[size]);
}; 