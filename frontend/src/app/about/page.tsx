'use client';

import React from 'react';
import { FaRocket, FaShieldAlt, FaUsers, FaHeart } from 'react-icons/fa';
import { MdOutlineSecurity, MdOutlineVerified } from 'react-icons/md';
import { BiBlock } from 'react-icons/bi';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Tickity 소개</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            NFT 기반의 혁신적인 콘서트 티켓팅 플랫폼으로, 
            암표 없는 공정한 티켓팅의 새로운 시대를 열어갑니다.
          </p>
        </div>
      </div>

      {/* Vision & Mission */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <FaRocket className="text-3xl text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-800">비전</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              암표 없는 공정한 티켓팅 문화를 만들어 모든 팬들이 
              안전하고 편리하게 좋아하는 아티스트의 공연을 즐길 수 있는 
              세상을 만드는 것입니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-6">
              <FaHeart className="text-3xl text-red-500 mr-4" />
              <h2 className="text-2xl font-bold text-gray-800">미션</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              블록체인 기술을 활용한 NFT 티켓 시스템으로 
              위변조 불가능한 안전한 티켓을 제공하고, 
              얼굴 인식 기술로 본인만 입장 가능한 
              혁신적인 티켓팅 서비스를 제공합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">핵심 가치</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">무결성</h3>
              <p className="text-gray-600">
                블록체인 기반 NFT 티켓으로 위변조가 불가능한 
                안전한 티켓팅 환경을 제공합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdOutlineVerified className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">공정성</h3>
              <p className="text-gray-600">
                암표 없는 공정한 티켓팅으로 모든 팬이 
                동등한 기회를 가질 수 있도록 합니다.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-2xl text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">사용자 중심</h3>
              <p className="text-gray-600">
                사용자 경험을 최우선으로 하여 
                편리하고 직관적인 서비스를 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">기술 스택</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <BiBlock className="text-3xl text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">블록체인</h3>
              <p className="text-gray-600 text-sm">
                NFT 기반 티켓 시스템으로 
                위변조 불가능한 안전한 티켓 제공
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <MdOutlineSecurity className="text-3xl text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">얼굴 인식</h3>
              <p className="text-gray-600 text-sm">
                본인만 입장 가능한 
                안전한 티켓 사용 시스템
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <FaShieldAlt className="text-3xl text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">무결성</h3>
              <p className="text-gray-600 text-sm">
                블록체인 기반으로 위변조가 불가능한 
                안전한 티켓 시스템 제공
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <FaRocket className="text-3xl text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">성능</h3>
              <p className="text-gray-600 text-sm">
                고성능 서버와 최적화된 
                사용자 경험 제공
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">팀 소개</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                3조
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">개발팀</h3>
              <p className="text-gray-600">
                프론트엔드, 백엔드, 블록체인 개발을 담당하는 
                전문 개발팀입니다.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                Tickity
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">기업</h3>
              <p className="text-gray-600">
                혁신적인 티켓팅 서비스를 제공하는 
                기술 기반 스타트업입니다.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                GitHub
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">오픈소스</h3>
              <p className="text-gray-600">
                <a 
                  href="https://github.com/kjaewon4/Tickity" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  GitHub 저장소
                </a>에서 
                프로젝트를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">문의하기</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
} 