// URL 슬러그 관련 유틸리티 함수들

/**
 * 간단한 숫자 ID URL 생성 (가장 실용적인 방식)
 * @param id 콘서트 ID
 * @returns 간단한 URL 경로
 */
export function createSimpleConcertUrl(id: string): string {
  return `/concert/${id}`;
}

/**
 * 공연명 기반 슬러그 생성 (SEO 친화적)
 * @param title 공연명
 * @returns URL 친화적인 슬러그
 */
export function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\d가-힣\s-]/g, '') // 한글, 영문, 숫자, 공백, -만 허용
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 정리
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
}

/**
 * 공연명 기반 URL 생성 (SEO 친화적)
 * @param title 공연명
 * @returns URL 경로
 */
export function createConcertSlugUrl(title: string): string {
  const slug = createSlugFromTitle(title);
  return `/concert/${slug}`;
}

/**
 * 하이브리드 URL 생성 (공연명 + 짧은 ID)
 * @param title 공연명
 * @param id 콘서트 ID
 * @returns URL 경로
 */
export function createConcertHybridUrl(title: string, id: string): string {
  const slug = createSlugFromTitle(title);
  const shortId = id.slice(0, 8);
  return `/concert/${slug}-${shortId}`;
}

/**
 * SEO 친화적인 공연 URL 생성 (공연명-짧은ID)
 * @param title 공연명
 * @param id 콘서트 ID
 * @returns SEO 친화적인 URL 경로
 */
export function createSeoConcertUrl(title: string, id: string): string {
  const slug = createSlugFromTitle(title);
  const shortId = id.slice(0, 8);
  return `/concert/${slug}-${shortId}`;
}

/**
 * 콘서트 URL 생성 (예약 페이지용)
 * @param id 콘서트 ID
 * @param title 공연명 (선택사항)
 * @returns URL 경로
 */
export function createConcertUrl(id: string, title?: string): string {
  if (title) {
    return createSeoConcertUrl(title, id);
  }
  return createSimpleConcertUrl(id);
}

/**
 * 슬러그에서 콘서트 ID 추출 (마지막 -이후 8글자)
 * @param slug URL 슬러그
 * @returns 콘서트 ID 일부
 */
export function extractConcertShortId(slug: string): string | null {
  const match = slug.match(/-([0-9a-f]{8})$/i);
  return match ? match[1] : null;
} 