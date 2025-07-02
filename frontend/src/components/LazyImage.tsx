'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  imageSize?: 'thumbnail' | 'small' | 'medium' | 'large';
  fallback?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  className = '',
  priority = false,
  quality = 75,
  imageSize = 'medium',
  fallback = '/images/default-poster.png'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer로 화면에 보일 때만 로드
  useEffect(() => {
    if (priority) {
      setIsInView(true); // priority가 true면 즉시 로드
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // 한번 보이면 observer 해제
        }
      },
      {
        rootMargin: '100px', // 100px 전에 미리 로드
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // 최적화된 이미지 URL 생성
  const getSafeImageUrl = (): string => {
    if (hasError || !src || typeof src !== 'string' || src.trim() === '') {
      return fallback;
    }
    try {
      return getOptimizedImageUrl(src, imageSize);
    } catch (error) {
      console.warn('이미지 URL 최적화 실패:', error);
      return fallback;
    }
  };
  
  const optimizedSrc = getSafeImageUrl();

  const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

  // fill 모드일 때는 부모가 이미 relative이고 크기가 설정되어 있다고 가정
  if (fill) {
    return (
      <div ref={imgRef} className="w-full h-full">
        {/* 로딩 스켈레톤 */}
        {!isLoaded && isInView && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}

        {/* 실제 이미지 (화면에 보일 때만 렌더링) */}
        {isInView && (
          <Image
            src={optimizedSrc}
            alt={alt}
            fill
            sizes={sizes}
            className={`${className} transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            quality={quality}
            priority={priority}
            placeholder="blur"
            blurDataURL={blurDataURL}
          />
        )}

        {/* 화면에 안 보일 때 플레이스홀더 */}
        {!isInView && !priority && (
          <div className="absolute inset-0 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-gray-400 text-xs">Loading...</div>
          </div>
        )}
      </div>
    );
  }

  // width/height 모드
  return (
    <div ref={imgRef} style={{ width, height }}>
      {/* 로딩 스켈레톤 */}
      {!isLoaded && isInView && (
        <div 
          className="bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}

      {/* 실제 이미지 (화면에 보일 때만 렌더링) */}
      {isInView && (
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          quality={quality}
          priority={priority}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      )}

      {/* 화면에 안 보일 때 플레이스홀더 */}
      {!isInView && !priority && (
        <div 
          className="bg-gray-100 rounded flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default LazyImage; 