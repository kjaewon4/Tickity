'use client';

import React from 'react';
import { FaSearch, FaUser, FaCreditCard, FaQrcode, FaCamera, FaCheckCircle } from 'react-icons/fa';
import { MdEvent, MdSecurity, MdPayment } from 'react-icons/md';

export default function GuidePage() {
  const steps = [
    {
      id: 1,
      title: '콘서트 검색 및 선택',
      description: '원하는 콘서트를 찾고 상세 정보를 확인합니다.',
      icon: FaSearch,
      details: [
        '홈페이지에서 콘서트 목록을 확인',
        '카테고리별 필터링 가능',
        '검색 기능으로 빠른 찾기',
        '콘서트 상세 정보 확인'
      ]
    },
    {
      id: 2,
      title: '회원가입 및 로그인',
      description: 'Tickity 계정을 만들고 로그인합니다.',
      icon: FaUser,
      details: [
        '이메일과 비밀번호로 회원가입',
        '이메일 인증 완료',
        '로그인 후 서비스 이용',
        '개인정보 보호 정책 확인'
      ]
    },
    {
      id: 3,
      title: '좌석 선택',
      description: '원하는 좌석을 선택하고 확인합니다.',
      icon: MdEvent,
      details: [
        '좌석도에서 원하는 좌석 선택',
        '좌석 등급별 가격 확인',
        '실시간 잔여석 확인',
        '좌석 선택 완료 후 다음 단계'
      ]
    },
    {
      id: 4,
      title: '얼굴 인식 등록',
      description: '입장을 위한 얼굴 정보를 등록합니다.',
      icon: FaCamera,
      details: [
        '카메라를 통한 얼굴 촬영',
        '얼굴 인식 정확도 확인',
        '본인 확인을 위한 필수 단계',
        '안전한 입장을 위한 보안 시스템'
      ]
    },
    {
      id: 5,
      title: '결제 및 티켓 발급',
      description: '안전한 결제 후 NFT 티켓을 발급받습니다.',
      icon: MdPayment,
      details: [
        '다양한 결제 방법 선택',
        'SSL 암호화로 안전한 결제',
        'NFT 티켓 자동 발급',
        '블록체인에 기록된 안전한 티켓'
      ]
    },
    {
      id: 6,
      title: 'QR 코드 확인',
      description: '발급받은 QR 코드로 입장합니다.',
      icon: FaQrcode,
      details: [
        '마이페이지에서 QR 코드 확인',
        '입장 시 QR 코드 스캔',
        '얼굴 인식으로 본인 확인',
        '안전하고 편리한 입장'
      ]
    }
  ];

  const tips = [
    {
      title: '예매 팁',
      items: [
        '예매 시작 시간을 미리 확인하세요',
        '인터넷 연결 상태를 점검하세요',
        '결제 수단을 미리 준비하세요',
        '여러 좌석을 동시에 선택할 수 있습니다'
      ]
    },
    {
      title: '보안 팁',
      items: [
        '얼굴 인식 등록 시 명확한 조명에서 촬영하세요',
        'QR 코드는 타인과 공유하지 마세요',
        '개인정보는 안전하게 보관하세요',
        '의심스러운 링크는 클릭하지 마세요'
      ]
    },
    {
      title: '환불 정책',
      items: [
        '공연일 7일 전까지 전액 환불 가능',
        '7일 이내 환불 시 수수료 발생',
        '환불 신청은 마이페이지에서 가능',
        '실제 입금은 결제방법에 따라 취소일로부터 2일 정도 소요될 수 있음'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">예매 가이드</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            NFT 티켓으로 안전하고 편리한 콘서트 예매 방법을 알아보세요.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">예매 단계</h2>
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-start gap-6">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center shrink-0">
                    <Icon className="text-2xl text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {step.id}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-800">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">{step.description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start gap-3">
                          <FaCheckCircle className="text-green-500 mt-1 shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">유용한 팁</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {tips.map((tip, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{tip.title}</h3>
                <ul className="space-y-3">
                  {tip.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Tickity만의 특별한 기능</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdSecurity className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">NFT 티켓</h3>
              <p className="text-gray-600 text-sm">
                블록체인 기반으로 위변조가 불가능한 
                안전한 디지털 티켓
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCamera className="text-2xl text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">얼굴 인식</h3>
              <p className="text-gray-600 text-sm">
                본인만 입장 가능한 얼굴 인식 시스템으로 안전한 입장 보장
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaQrcode className="text-2xl text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">QR 입장</h3>
              <p className="text-gray-600 text-sm">
                간편한 QR 코드 스캔으로 빠르고 편리한 입장
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-2xl text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">공정한 티켓팅</h3>
              <p className="text-gray-600 text-sm">
                암표 없는 공정한 티켓팅으로 모든 팬이 동등한 기회
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">자주 묻는 질문</h2>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Q: NFT 티켓이 무엇인가요?</h3>
              <p className="text-gray-600">
                NFT 티켓은 블록체인 기술을 활용한 디지털 티켓입니다. 위변조가 불가능하며, 
                본인만 사용할 수 있는 안전한 티켓입니다.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Q: 얼굴 인식은 필수인가요?</h3>
              <p className="text-gray-600">
                네, 얼굴 인식 등록은 필수입니다. 본인만 입장할 수 있도록 하여 
                티켓 위변조를 방지하고 안전한 입장을 보장합니다.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Q: 환불은 어떻게 하나요?</h3>
              <p className="text-gray-600">
                공연일 7일 전까지는 전액 환불이 가능합니다. 마이페이지에서 
                환불 신청을 할 수 있으며, 실제 입금은 결제방법에 따라 취소일로부터 2일 정도 소요될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">도움이 필요하신가요?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4">고객센터</h3>
              <p className="text-gray-300">1588-1234</p>
              <p className="text-gray-300">평일 09:00 ~ 18:00</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">이메일</h3>
              <p className="text-gray-300">support@tickity.com</p>
              <p className="text-gray-300">24시간 접수 가능</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">FAQ</h3>
              <p className="text-gray-300">
                <a href="/faq" className="text-blue-400 hover:text-blue-300 underline">
                  자주 묻는 질문 →
                </a>
              </p>
              <p className="text-gray-300">빠른 답변 확인</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 