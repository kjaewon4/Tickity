'use client';

import React, { useState } from 'react';
import { FaBullhorn, FaExclamationTriangle, FaInfoCircle, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { MdPriorityHigh } from 'react-icons/md';

export default function NoticePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: '전체', icon: FaBullhorn },
    { id: 'important', name: '중요', icon: FaExclamationTriangle },
    { id: 'general', name: '일반', icon: FaInfoCircle },
    { id: 'update', name: '업데이트', icon: FaCalendarAlt },
  ];

  const notices = [
    {
      id: 1,
      title: '[중요] 서비스 점검 안내 (2025.01.20)',
      category: 'important',
      date: '2025-01-15',
      views: 1250,
      content: '2025년 1월 20일 새벽 2시부터 4시까지 서비스 점검이 예정되어 있습니다. 점검 시간 동안 서비스 이용이 제한될 수 있으니 참고해 주시기 바랍니다.',
      isNew: true
    },
    {
      id: 2,
      title: 'NFT 티켓 시스템 업데이트 완료',
      category: 'update',
      date: '2025-01-10',
      views: 890,
      content: 'NFT 티켓 시스템이 업데이트되어 더욱 안전하고 편리한 서비스를 제공합니다. 새로운 기능과 개선사항을 확인해 보세요.',
      isNew: true
    },
    {
      id: 3,
      title: '얼굴 인식 입장 시스템 도입',
      category: 'general',
      date: '2025-01-05',
      views: 1560,
      content: '본인만 입장 가능한 얼굴 인식 시스템이 도입되었습니다. 티켓 위변조를 방지하고 안전한 입장을 보장합니다.',
      isNew: false
    },
    {
      id: 4,
      title: '2025년 연말 콘서트 예매 안내',
      category: 'general',
      date: '2024-12-30',
      views: 2100,
      content: '2025년 연말을 맞아 다양한 콘서트가 예매를 시작합니다. NFT 티켓으로 안전하고 편리하게 예매하세요.',
      isNew: false
    },
    {
      id: 5,
      title: '개인정보처리방침 개정 안내',
      category: 'important',
      date: '2024-12-25',
      views: 750,
      content: '개인정보처리방침이 개정되었습니다. 개정된 내용을 확인하시고 서비스 이용에 참고해 주시기 바랍니다.',
      isNew: false
    },
    {
      id: 6,
      title: '모바일 앱 업데이트 안내',
      category: 'update',
      date: '2024-12-20',
      views: 680,
      content: 'Tickity 모바일 앱이 업데이트되었습니다. 새로운 기능과 개선된 사용자 경험을 확인해 보세요.',
      isNew: false
    },
    {
      id: 7,
      title: '블록체인 보안 강화 완료',
      category: 'update',
      date: '2024-12-15',
      views: 920,
      content: '블록체인 보안이 강화되어 더욱 안전한 NFT 티켓 서비스를 제공합니다. 보안 업데이트 내용을 확인해 보세요.',
      isNew: false
    },
    {
      id: 8,
      title: '고객센터 운영시간 안내',
      category: 'general',
      date: '2024-12-10',
      views: 450,
      content: '고객센터 운영시간은 평일 09:00 ~ 18:00입니다. 주말 및 공휴일에는 이메일로 문의해 주시기 바랍니다.',
      isNew: false
    }
  ];

  const filteredNotices = notices.filter(notice => {
    const categoryMatch = selectedCategory === 'all' || notice.category === selectedCategory;
    const searchMatch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">공지사항</h1>
          <p className="text-lg opacity-90">
            Tickity의 최신 소식과 중요한 안내사항을 확인하세요.
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="공지사항 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaBullhorn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="text-sm" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Notice List */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="space-y-4">
          {filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {notice.category === 'important' && (
                    <MdPriorityHigh className="text-red-500 text-xl" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {notice.title}
                    {notice.isNew && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        NEW
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt />
                    <span>{notice.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaEye />
                    <span>{notice.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {notice.content}
              </p>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  notice.category === 'important' 
                    ? 'bg-red-100 text-red-800'
                    : notice.category === 'update'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {categories.find(c => c.id === notice.category)?.name}
                </span>
                
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  자세히 보기 →
                </button>
              </div>
            </div>
          ))}

          {filteredNotices.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📢</div>
              <p className="text-gray-500 text-lg">
                {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '등록된 공지사항이 없습니다.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredNotices.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                이전
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">2</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">3</button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-gray-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-8">빠른 링크</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">고객지원</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/faq" className="hover:text-white">자주 묻는 질문</a></li>
                <li><a href="/guide" className="hover:text-white">예매 가이드</a></li>
                <li><a href="/contact" className="hover:text-white">1:1 문의</a></li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">법적고지</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/terms" className="hover:text-white">이용약관</a></li>
                <li><a href="/privacy" className="hover:text-white">개인정보처리방침</a></li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">회사정보</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/about" className="hover:text-white">회사소개</a></li>
                <li><a href="/careers" className="hover:text-white">채용</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 