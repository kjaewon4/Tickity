'use client';

import React from 'react';
import { FaFileContract, FaShieldAlt, FaUserCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">이용약관</h1>
          <p className="text-lg opacity-90">
            Tickity 서비스 이용에 관한 약관입니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaFileContract className="text-2xl text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">제1조 (목적)</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              이 약관은 Tickity(이하 "회사")가 제공하는 NFT 기반 콘서트 티켓팅 서비스(이하 "서비스")의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaUserCheck className="text-2xl text-green-600" />
              <h2 className="text-2xl font-bold text-gray-800">제2조 (정의)</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. "서비스"</strong>란 회사가 제공하는 NFT 기반 콘서트 티켓팅 플랫폼을 의미합니다.</p>
              <p><strong>2. "이용자"</strong>란 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</p>
              <p><strong>3. "NFT 티켓"</strong>이란 블록체인 기술을 활용하여 발급되는 디지털 티켓을 의미합니다.</p>
              <p><strong>4. "콘서트"</strong>란 회사가 서비스를 통해 제공하는 공연 정보를 의미합니다.</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="text-2xl text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-800">제3조 (서비스의 제공)</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 회사는 다음과 같은 서비스를 제공합니다:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>콘서트 정보 제공 및 예매 서비스</li>
                <li>NFT 티켓 발급 및 관리 서비스</li>
                <li>얼굴 인식 기반 입장 서비스</li>
                <li>블록체인 기반 보안 서비스</li>
                <li>고객 지원 및 문의 서비스</li>
              </ul>
              <p><strong>2. 서비스의 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.</strong></p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-2xl text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-800">제4조 (이용자의 의무)</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p><strong>이용자는 다음 사항을 준수해야 합니다:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>본인의 실명과 정확한 정보로 가입하여야 합니다.</li>
                <li>얼굴 인식 등록 시 본인의 얼굴을 정확히 촬영해야 합니다.</li>
                <li>NFT 티켓을 타인에게 양도하거나 판매해서는 안 됩니다.</li>
                <li>서비스 이용 중 불법적인 행위를 해서는 안 됩니다.</li>
                <li>타인의 개인정보를 수집, 저장, 공개해서는 안 됩니다.</li>
                <li>회사의 서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 유통하거나 상업적으로 이용해서는 안 됩니다.</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제5조 (NFT 티켓 관련 규정)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. NFT 티켓의 특성:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>NFT 티켓은 소울바운드 토큰으로 양도가 불가능합니다.</li>
                <li>블록체인에 기록되어 위변조가 불가능합니다.</li>
                <li>본인만 사용할 수 있는 안전한 티켓입니다.</li>
                <li>블록체인의 무결성으로 투명한 티켓팅을 보장합니다.</li>
              </ul>
              <p><strong>2. 티켓 사용 규정:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>공연 당일 QR 코드와 얼굴 인식으로 입장합니다.</li>
                <li>티켓을 타인에게 양도하거나 판매할 수 없습니다.</li>
                <li>티켓 위변조 시 법적 책임을 질 수 있습니다.</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제6조 (환불 정책)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 환불 가능 기간:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>공연일 7일 전까지: 전액 환불</li>
                <li>공연일 7일 이내: 환불 불가 (단, 공연 취소 시 제외)</li>
              </ul>
              <p><strong>2. 환불 절차:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>마이페이지에서 환불 신청</li>
                <li>실제 입금은 결제방법에 따라 취소일로부터 2일 정도 소요될 수 있습니다.</li>
                <li>결제 수단에 따라 환불 방법이 다를 수 있습니다.</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제7조 (개인정보 보호)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 개인정보 수집 및 이용:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회원가입 시: 이메일, 비밀번호, 이름</li>
                <li>얼굴 인식 등록 시: 얼굴 이미지 데이터</li>
                <li>결제 시: 결제 정보 (신용카드 정보는 저장하지 않음)</li>
              </ul>
              <p><strong>2. 개인정보 보호:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>모든 개인정보는 암호화되어 저장됩니다.</li>
                <li>얼굴 인식 데이터는 안전한 서버에 보관됩니다.</li>
                <li>개인정보는 서비스 제공 목적 외에는 사용되지 않습니다.</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제8조 (서비스 중단 및 변경)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 서비스 중단:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>시스템 점검, 보수, 교체 시</li>
                <li>천재지변, 전쟁, 테러 등 불가항력적 사유로 인한 경우</li>
                <li>기타 회사가 서비스 제공이 불가능하다고 판단하는 경우</li>
              </ul>
              <p><strong>2. 서비스 변경:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회사는 서비스의 내용을 변경할 수 있습니다.</li>
                <li>중대한 변경사항은 사전에 공지합니다.</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제9조 (책임 제한)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 회사의 책임 제한:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>천재지변, 전쟁, 테러 등 불가항력적 사유로 인한 서비스 중단</li>
                <li>이용자의 귀책사유로 인한 서비스 이용 장애</li>
                <li>제3자가 제공하는 서비스의 장애</li>
              </ul>
              <p><strong>2. 이용자의 책임:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>본인의 실수로 인한 티켓 손실</li>
                <li>얼굴 인식 등록 오류로 인한 입장 불가</li>
                <li>타인에게 티켓을 양도하거나 판매한 경우</li>
              </ul>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">제10조 (분쟁 해결)</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>1. 분쟁 해결 방법:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회사와 이용자 간의 분쟁은 우선 협의를 통해 해결합니다.</li>
                <li>협의가 이루어지지 않을 경우 관련 법령에 따라 해결합니다.</li>
              </ul>
              <p><strong>2. 관할 법원:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>회사의 주소지 관할 법원을 관할 법원으로 합니다.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">부칙</h3>
              <div className="text-gray-700 space-y-2">
                <p><strong>제1조 (시행일)</strong></p>
                <p>이 약관은 2025년 1월 1일부터 시행합니다.</p>
                <p><strong>제2조 (약관 변경)</strong></p>
                <p>이 약관의 변경사항은 공지 후 7일이 경과한 날부터 효력이 발생합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">문의하기</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">약관 관련 문의</h3>
              <p className="text-gray-600">support@tickity.com</p>
              <p className="text-sm text-gray-500">평일 09:00 ~ 18:00</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">고객센터</h3>
              <p className="text-gray-600">1588-1234</p>
              <p className="text-sm text-gray-500">24시간 접수 가능</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 