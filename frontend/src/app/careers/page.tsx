'use client';

import React, { useState } from 'react';
import { FaUsers, FaHeart, FaRocket, FaGraduationCap, FaBriefcase, FaLaptopCode } from 'react-icons/fa';
import { MdWork, MdLocationOn, MdAttachMoney } from 'react-icons/md';

export default function CareersPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const jobCategories = [
    { id: 'all', name: '전체' },
    { id: 'frontend', name: '프론트엔드' },
    { id: 'backend', name: '백엔드' },
    { id: 'blockchain', name: '블록체인' },
    { id: 'ai', name: 'AI/ML' },
  ];

  const jobListings = [
    {
      id: 1,
      title: '시니어 프론트엔드 개발자',
      category: 'frontend',
      location: '서울 강남구',
      type: '정규직',
      experience: '3년 이상',
      salary: '면접 후 결정',
      description: 'React, Next.js를 활용한 웹 애플리케이션 개발',
      requirements: [
        'React, TypeScript 3년 이상 경력',
        'Next.js, Tailwind CSS 경험',
        '성능 최적화 및 사용자 경험 개선 경험',
        '팀 협업 및 코드 리뷰 경험'
      ]
    },
    {
      id: 2,
      title: '백엔드 개발자',
      category: 'backend',
      location: '서울 강남구',
      type: '정규직',
      experience: '2년 이상',
      salary: '면접 후 결정',
      description: 'Node.js, PostgreSQL을 활용한 서버 개발',
      requirements: [
        'Node.js, TypeScript 2년 이상 경력',
        'PostgreSQL, Redis 경험',
        'RESTful API 설계 및 개발 경험',
        'AWS, Docker 경험 우대'
      ]
    },
    {
      id: 3,
      title: '블록체인 개발자',
      category: 'blockchain',
      location: '서울 강남구',
      type: '정규직',
      experience: '1년 이상',
      salary: '면접 후 결정',
      description: 'NFT 티켓 시스템 개발 및 스마트 컨트랙트 구현',
      requirements: [
        'Solidity, Web3.js 경험',
        'Ethereum 블록체인 개발 경험',
        'NFT, 스마트 컨트랙트 개발 경험',
        '보안에 대한 이해'
      ]
    },
    {
      id: 4,
      title: 'AI/ML 엔지니어',
      category: 'ai',
      location: '서울 강남구',
      type: '정규직',
      experience: '2년 이상',
      salary: '면접 후 결정',
      description: '얼굴 인식 시스템 개발 및 AI 모델 최적화',
      requirements: [
        'Python, TensorFlow/PyTorch 경험',
        '컴퓨터 비전, 얼굴 인식 경험',
        '모델 최적화 및 성능 튜닝 경험',
        '실시간 처리 시스템 개발 경험'
      ]
    }
  ];

  const filteredJobs = selectedCategory === 'all' 
    ? jobListings 
    : jobListings.filter(job => job.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Tickity와 함께하세요</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            혁신적인 티켓팅 플랫폼을 만들어가는 여정에 함께할 
            열정적인 개발자들을 찾고 있습니다.
          </p>
        </div>
      </div>

      {/* Company Culture */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">회사 문화</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUsers className="text-2xl text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">협업 중심</h3>
            <p className="text-gray-600">
              팀워크를 중시하며, 서로의 아이디어를 존중하고 
              함께 성장하는 문화를 만들어갑니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaRocket className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">혁신 추구</h3>
            <p className="text-gray-600">
              최신 기술을 적극적으로 도입하고, 
              새로운 아이디어를 실현할 수 있는 환경을 제공합니다.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHeart className="text-2xl text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">사용자 중심</h3>
            <p className="text-gray-600">
              사용자의 니즈를 최우선으로 생각하며, 
              더 나은 서비스를 만들기 위해 노력합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">복리후생</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdAttachMoney className="text-xl text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">경쟁력 있는 연봉</h3>
              <p className="text-gray-600 text-sm">
                업계 평균 이상의 
                경쟁력 있는 연봉 제공
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="text-xl text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">교육 지원</h3>
              <p className="text-gray-600 text-sm">
                컨퍼런스 참가, 
                온라인 강의 지원
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdWork className="text-xl text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">유연한 근무</h3>
              <p className="text-gray-600 text-sm">
                재택근무, 
                자유로운 출퇴근 시간
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLaptopCode className="text-xl text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-800">최신 장비</h3>
              <p className="text-gray-600 text-sm">
                맥북, 모니터 등 
                최신 개발 장비 제공
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">채용 공고</h2>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {jobCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Job Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {job.type}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MdLocationOn className="mr-2" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaBriefcase className="mr-2" />
                    <span>경력 {job.experience}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MdAttachMoney className="mr-2" />
                    <span>{job.salary}</span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{job.description}</p>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">주요 요구사항</h4>
                  <ul className="space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                  지원하기
                </button>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">해당 카테고리의 채용 공고가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-8">문의하기</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-4">채용 문의</h3>
              <p className="text-gray-300">careers@tickity.com</p>
              <p className="text-gray-300">평일 09:00 ~ 18:00</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">일반 문의</h3>
              <p className="text-gray-300">support@tickity.com</p>
              <p className="text-gray-300">24시간 접수 가능</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 