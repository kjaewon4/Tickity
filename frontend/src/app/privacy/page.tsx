'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">개인정보처리방침</h1>
          <p className="text-lg opacity-90">
            Tickity는 이용자의 개인정보 보호를 최우선으로 합니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. 개인정보의 처리 목적</h2>
            <div className="space-y-4 text-gray-700">
              <p>Tickity(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">주요 처리 목적:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>회원가입 및 회원 관리</li>
                  <li>콘서트 예매 서비스 제공</li>
                  <li>NFT 티켓 발급 및 관리</li>
                  <li>얼굴 인식 기반 입장 서비스</li>
                  <li>고객 지원 및 문의 응대</li>
                  <li>서비스 개선 및 마케팅</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. 개인정보의 처리 및 보유기간</h2>
            <div className="space-y-4 text-gray-700">
              <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">개인정보 보유기간:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>회원정보:</strong> 회원 탈퇴 시까지 (단, 관련 법령에 따라 보존이 필요한 경우 해당 기간)</li>
                  <li><strong>얼굴 인식 데이터:</strong> 회원 탈퇴 시 즉시 삭제</li>
                  <li><strong>결제 정보:</strong> 관련 법령에 따라 5년간 보관</li>
                  <li><strong>서비스 이용 기록:</strong> 3년간 보관</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. 수집하는 개인정보 항목</h2>
            <div className="space-y-4 text-gray-700">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">필수 수집 항목:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>회원가입 시:</strong> 이메일, 비밀번호, 이름</li>
                  <li><strong>얼굴 인식 등록 시:</strong> 얼굴 이미지 데이터</li>
                  <li><strong>결제 시:</strong> 결제 수단 정보 (신용카드 정보는 저장하지 않음)</li>
                </ul>
                <h3 className="font-semibold mb-3 text-gray-800 mt-4">자동 수집 항목:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>서비스 이용 기록:</strong> IP 주소, 쿠키, 접속 로그</li>
                  <li><strong>기기 정보:</strong> 브라우저 정보, 운영체제 정보</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. 개인정보의 제3자 제공</h2>
            <div className="space-y-4 text-gray-700">
              <p>회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">제3자 제공 시기:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>콘서트 주최사와의 계약에 따른 티켓 정보 제공</li>
                  <li>법령에 따른 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                  <li>정보주체가 사전에 동의한 경우</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. 개인정보의 안전성 확보 조치</h2>
            <div className="space-y-4 text-gray-700">
              <p>회사는 개인정보보호법 제29조에 따라 다음과 같은 안전성 확보 조치를 취하고 있습니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">보안 조치:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>개인정보의 암호화:</strong> 이용자의 개인정보는 비밀번호는 암호화되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화하여 사용합니다.</li>
                  <li><strong>해킹 등에 대비한 기술적 대책:</strong> 회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                  <li><strong>개인정보에 대한 접근 제한:</strong> 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근을 통제하고 있으며, 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. 정보주체의 권리·의무 및 그 행사방법</h2>
            <div className="space-y-4 text-gray-700">
              <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">정보주체의 권리:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>개인정보 열람요구:</strong> 개인정보보호법 제35조에 따른 개인정보의 열람</li>
                  <li><strong>오류 등이 있을 경우 정정·삭제요구:</strong> 개인정보보호법 제36조에 따른 개인정보의 정정·삭제</li>
                  <li><strong>처리정지 요구:</strong> 개인정보보호법 제37조에 따른 개인정보의 처리정지</li>
                  <li><strong>개인정보 처리정지 요구:</strong> 개인정보보호법 제38조에 따른 개인정보의 처리정지</li>
                </ul>
                <h3 className="font-semibold mb-3 text-gray-800 mt-4">권리 행사 방법:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>마이페이지에서 직접 처리</li>
                  <li>고객센터(1588-1234)를 통한 요청</li>
                  <li>이메일(support@tickity.com)을 통한 요청</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. 개인정보의 파기</h2>
            <div className="space-y-4 text-gray-700">
              <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">파기 절차 및 방법:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>전자적 파일 형태:</strong> 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
                  <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
                  <li><strong>얼굴 인식 데이터:</strong> 회원 탈퇴 시 즉시 완전 삭제</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. 개인정보 보호책임자</h2>
            <div className="space-y-4 text-gray-700">
              <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-gray-800">개인정보 보호책임자:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>성명:</strong> 개인정보보호책임자</li>
                  <li><strong>직책:</strong> CTO</li>
                  <li><strong>연락처:</strong> 1588-1234, support@tickity.com</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. 개인정보 처리방침 변경</h2>
            <div className="space-y-4 text-gray-700">
              <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">시행일자</h3>
              <div className="text-gray-700 space-y-2">
                <p><strong>시행일자:</strong> 2025년 1월 1일</p>
                <p><strong>최종 수정일:</strong> 2025년 1월 1일</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">개인정보 관련 문의</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">개인정보 보호책임자</h3>
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