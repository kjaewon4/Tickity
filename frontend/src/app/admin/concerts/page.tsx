'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';

interface Venue {
  id: string;
  name: string;
  address: string;
  capacity?: number;
}

interface Concert {
  id: string;
  title: string;
  date: string;
  main_performer: string;
  organizer: string;
  category: string;
  age_rating: string;
  running_time: string;
  booking_fee: number;
  valid_from: string;
  valid_to: string;
  venues?: Venue;
  poster_url?: string;
  round: number;
  created_at: string;
}

export default function AdminConcertsPage() {
  const router = useRouter();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 콘서트 목록 로드
  useEffect(() => {
    const loadConcerts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/concerts');
        if (response.success && response.data) {
          // 백엔드에서 { concerts: [...], total: number } 형태로 반환
          setConcerts(response.data.concerts || []);
        }
      } catch (error) {
        console.error('콘서트 목록 로드 실패:', error);
        alert('콘서트 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadConcerts();
  }, []);

  // 콘서트 삭제
  const handleDelete = async (concertId: string, title: string) => {
    if (!confirm(`"${title}" 콘서트를 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/concerts/${concertId}`);
      if (response.success) {
        alert('콘서트가 삭제되었습니다.');
        setConcerts(prev => prev.filter(concert => concert.id !== concertId));
      } else {
        alert(`삭제 실패: ${response.error}`);
      }
    } catch (error: any) {
      console.error('콘서트 삭제 실패:', error);
      alert(`삭제 실패: ${error.response?.data?.error || '알 수 없는 오류'}`);
    }
  };

  // 검색 필터링
  const filteredConcerts = concerts.filter(concert =>
    concert.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    concert.main_performer.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPeriod = (from: string, to: string) => {
    const fromDate = new Date(from).toLocaleDateString('ko-KR');
    const toDate = new Date(to).toLocaleDateString('ko-KR');
    return `${fromDate} ~ ${toDate}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">콘서트 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">콘서트 관리</h1>
                <p className="mt-1 text-sm text-gray-600">등록된 콘서트 목록을 관리합니다</p>
              </div>
              <Link
                href="/admin/concert-create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                새 콘서트 등록
              </Link>
            </div>
          </div>

          {/* 검색 */}
          <div className="px-6 py-4">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="콘서트 제목 또는 아티스트 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 콘서트 목록 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              전체 콘서트 ({filteredConcerts.length}개)
            </h2>
          </div>

          {filteredConcerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {searchKeyword ? '검색 결과가 없습니다.' : '등록된 콘서트가 없습니다.'}
              </p>
              {!searchKeyword && (
                <Link
                  href="/admin/concert-create"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  첫 번째 콘서트 등록하기
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      콘서트 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      공연 일시
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      공연장
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      예매 기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConcerts.map((concert) => {
                    const now = new Date();
                    const validFrom = new Date(concert.valid_from);
                    const validTo = new Date(concert.valid_to);
                    const concertDate = new Date(concert.date);
                    
                    let status = '';
                    let statusColor = '';
                    
                    if (now < validFrom) {
                      status = '예매 대기';
                      statusColor = 'text-yellow-600 bg-yellow-100';
                    } else if (now >= validFrom && now <= validTo) {
                      status = '예매 중';
                      statusColor = 'text-green-600 bg-green-100';
                    } else if (now > validTo && now < concertDate) {
                      status = '예매 종료';
                      statusColor = 'text-red-600 bg-red-100';
                    } else {
                      status = '공연 완료';
                      statusColor = 'text-gray-600 bg-gray-100';
                    }

                    return (
                      <tr key={concert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {concert.poster_url && (
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded object-cover"
                                  src={concert.poster_url}
                                  alt={concert.title}
                                />
                              </div>
                            )}
                            <div className={concert.poster_url ? "ml-4" : ""}>
                              <div className="text-sm font-medium text-gray-900">
                                {concert.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {concert.main_performer}
                              </div>
                              <div className="text-xs text-gray-400">
                                {concert.category} • {concert.age_rating}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(concert.date)}
                          <div className="text-xs text-gray-500">
                            {concert.round}회차
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {concert.venues ? (
                            <div>
                              <div className="font-medium">{concert.venues.name}</div>
                              <div className="text-xs text-gray-500">{concert.venues.address}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">장소 미정</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPeriod(concert.valid_from, concert.valid_to)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/admin/concerts/${concert.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              보기
                            </Link>
                            <Link
                              href={`/admin/concerts/${concert.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              수정
                            </Link>
                            <button
                              onClick={() => handleDelete(concert.id, concert.title)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 