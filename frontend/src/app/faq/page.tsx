'use client';

import React, { useState } from 'react';
import { FaQuestionCircle, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdPayment, MdSecurity, MdAccountCircle, MdEvent } from 'react-icons/md';

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const categories = [
    { id: 'all', name: '전체', icon: FaQuestionCircle },
    { id: 'account', name: '계정', icon: MdAccountCircle },
    { id: 'booking', name: '예매', icon: MdEvent },
    { id: 'payment', name: '결제', icon: MdPayment },
    { id: 'security', name: '보안', icon: MdSecurity },
  ];

  const faqs = [
    {
      id: 1,
      question: 'NFT 티켓이 무엇인가요?',
      answer: 'NFT 티켓은 블록체인 기술을 활용한 디지털 티켓입니다. 블록체인의 특성상 위변조가 불가능하며, 본인만 사용할 수 있는 안전한 티켓입니다. 블록체인에 기록되어 있어 무결성이 보장되는 투명한 티켓팅을 제공합니다.',
      category: 'security',
      tags: ['NFT', '블록체인', '무결성']
    },
    {
      id: 2,
      question: '얼굴 인식 입장은 어떻게 작동하나요?',
      answer: '예매 시 등록한 얼굴 정보와 입장 시 촬영된 얼굴을 비교하여 본인 확인을 진행합니다. 본인만 입장할 수 있어 티켓 위변조를 방지하고 안전한 입장을 보장합니다.',
      category: 'security',
      tags: ['얼굴인식', '입장', '보안']
    },
    {
      id: 3,
      question: '예매는 언제부터 가능한가요?',
      answer: '각 콘서트마다 예매 시작 시간이 다릅니다. 콘서트 상세 페이지에서 정확한 예매 시작 시간을 확인할 수 있습니다. 예매 시작 전에는 알림을 받을 수 있도록 설정할 수 있습니다.',
      category: 'booking',
      tags: ['예매', '시간', '알림']
    },
    {
      id: 4,
      question: '결제 방법은 어떤 것들이 있나요?',
      answer: '신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이, 토스) 등 다양한 결제 방법을 지원합니다. 모든 결제는 안전한 SSL 암호화로 보호됩니다.',
      category: 'payment',
      tags: ['결제', '카드', '간편결제']
    },
    {
      id: 5,
      question: '환불은 어떻게 하나요?',
      answer: '공연일 7일 전까지는 전액 환불이 가능합니다. 7일 이내에는 환불이 제한될 수 있습니다. 환불 신청은 마이페이지에서 가능하며, 실제 입금은 결제방법에 따라 취소일로부터 2일 정도 소요될 수 있습니다.',
      category: 'booking',
      tags: ['환불', '정책', '마이페이지']
    },
    {
      id: 6,
      question: '계정을 어떻게 만들 수 있나요?',
      answer: '회원가입 페이지에서 이메일과 비밀번호를 입력하여 계정을 만들 수 있습니다. 가입 후 이메일 인증을 완료하면 모든 서비스를 이용할 수 있습니다.',
      category: 'account',
      tags: ['회원가입', '이메일', '인증']
    },
    {
      id: 7,
      question: '비밀번호를 잊어버렸어요.',
      answer: '로그인 페이지의 "비밀번호 찾기"를 클릭하여 이메일로 임시 비밀번호를 받을 수 있습니다. 임시 비밀번호로 로그인 후 새로운 비밀번호로 변경해 주세요.',
      category: 'account',
      tags: ['비밀번호', '찾기', '이메일']
    },
    {
      id: 8,
      question: '티켓을 양도할 수 있나요?',
      answer: 'NFT 티켓은 소울바운드 토큰으로 양도가 불가능합니다. 이는 티켓 위변조를 방지하고 공정한 티켓팅을 보장하기 위한 정책입니다.',
      category: 'security',
      tags: ['양도', '소울바운드', '정책']
    },
    {
      id: 9,
      question: '모바일에서도 예매가 가능한가요?',
      answer: '네, 모바일 브라우저와 모바일 앱에서 모두 예매가 가능합니다. 반응형 웹으로 제작되어 모든 기기에서 편리하게 이용할 수 있습니다.',
      category: 'booking',
      tags: ['모바일', '앱', '반응형']
    },
    {
      id: 10,
      question: '고객센터 연락처는 무엇인가요?',
      answer: '고객센터는 1588-1234로 연락 가능하며, 평일 09:00 ~ 18:00 운영됩니다. 이메일(support@tickity.com)로는 24시간 문의가 가능합니다.',
      category: 'account',
      tags: ['고객센터', '연락처', '운영시간']
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const categoryMatch = selectedCategory === 'all' || faq.category === selectedCategory;
    const searchMatch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">자주 묻는 질문</h1>
          <p className="text-lg opacity-90">
            Tickity 이용에 궁금한 점들을 빠르게 찾아보세요.
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
                  placeholder="질문을 검색해보세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaQuestionCircle className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {faq.question}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {faq.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {openItems.includes(faq.id) ? (
                  <FaChevronUp className="text-gray-400" />
                ) : (
                  <FaChevronDown className="text-gray-400" />
                )}
              </button>
              
              {openItems.includes(faq.id) && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">❓</div>
              <p className="text-gray-500 text-lg">
                {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '등록된 FAQ가 없습니다.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">더 궁금한 점이 있으신가요?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4">고객센터</h3>
              <p className="text-gray-300">1588-1234</p>
              <p className="text-gray-300">평일 09:00 ~ 18:00</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">이메일 문의</h3>
              <p className="text-gray-300">support@tickity.com</p>
              <p className="text-gray-300">24시간 접수 가능</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">1:1 문의</h3>
              <p className="text-gray-300">
                <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">
                  문의하기 →
                </a>
              </p>
              <p className="text-gray-300">상세한 답변 제공</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 