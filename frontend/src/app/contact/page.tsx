'use client';

import React, { useState } from 'react';
import { FaEnvelope, FaPhone, FaClock, FaUser, FaFileAlt, FaPaperPlane } from 'react-icons/fa';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    subject: '',
    message: '',
    agreeToTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories = [
    { id: 'general', name: '일반 문의' },
    { id: 'technical', name: '기술 문의' },
    { id: 'booking', name: '예매 문의' },
    { id: 'refund', name: '환불 문의' },
    { id: 'security', name: '보안 문의' },
    { id: 'other', name: '기타' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 실제 구현에서는 API 호출
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: '',
        subject: '',
        message: '',
        agreeToTerms: false
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">1:1 문의</h1>
          <p className="text-lg opacity-90">
            궁금한 점이나 문제가 있으시면 언제든 문의해 주세요.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">문의하기</h2>
            
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPaperPlane className="text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">문의가 접수되었습니다</h3>
                <p className="text-gray-600 mb-6">
                  빠른 시일 내에 답변드리겠습니다.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  새 문의 작성
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="이메일을 입력하세요"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    연락처
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="연락처를 입력하세요 (선택)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 유형 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">문의 유형을 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="문의 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 내용 *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="문의 내용을 자세히 입력해 주세요"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    required
                    className="mt-1"
                  />
                  <label className="text-sm text-gray-600">
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      개인정보처리방침
                    </a>에 동의합니다. *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      접수 중...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      문의 접수하기
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">연락처 정보</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <FaPhone className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">고객센터</h3>
                    <p className="text-gray-600">1588-1234</p>
                    <p className="text-sm text-gray-500">평일 09:00 ~ 18:00</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <MdEmail className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">이메일</h3>
                    <p className="text-gray-600">support@tickity.com</p>
                    <p className="text-sm text-gray-500">24시간 접수 가능</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <MdLocationOn className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">주소</h3>
                    <p className="text-gray-600">서울특별시 강남구 테헤란로 123</p>
                    <p className="text-sm text-gray-500">Tickity 빌딩 5층</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">자주 묻는 질문</h2>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">문의 처리 시간은 얼마나 걸리나요?</h3>
                  <p className="text-gray-600 text-sm">
                    일반적으로 1-2일 내에 답변드립니다. 긴급한 문의는 고객센터로 연락해 주세요.
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">기술적인 문제는 어떻게 해결하나요?</h3>
                  <p className="text-gray-600 text-sm">
                    기술 문의는 전문팀이 담당하여 신속하고 정확한 답변을 제공합니다.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">개인정보는 안전한가요?</h3>
                  <p className="text-gray-600 text-sm">
                    모든 개인정보는 암호화되어 안전하게 보관되며, 문의 목적 외에는 사용되지 않습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">실시간 채팅</h2>
              <p className="mb-6 opacity-90">
                빠른 답변이 필요하시면 실시간 채팅을 이용해 보세요.
              </p>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                채팅 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 mt-10 pt-6 text-center space-y-2">
        <p>
          (주)티키티컴퍼니 | 대표: 3조 | GitHub: https://github.com/kjaewon4/Tickity<br />
        </p>
        <p>© 2025 Tickity Corp. All rights reserved.</p>
      </div>
    </div>
  );
} 