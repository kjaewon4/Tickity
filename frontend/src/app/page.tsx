'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { UserInfo } from "@/types/auth";

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);

    if (token) {
      // 백엔드 API로 사용자 정보 조회
      const getUser = async (): Promise<void> => {
        try {
          const response = await apiClient.getUserWithToken(token);
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // 토큰이 유효하지 않으면 제거
            localStorage.removeItem('accessToken');
            setAccessToken(null);
          }
        } catch (error) {
          console.error('사용자 정보 조회 오류:', error);
          localStorage.removeItem('accessToken');
          setAccessToken(null);
        } finally {
          setLoading(false);
        }
      };

      getUser();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      if (accessToken) {
        await apiClient.logout(accessToken);
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAccessToken(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 에러가 발생해도 로컬 상태는 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAccessToken(null);
    }
  };

  // 사용자 표시 이름 가져오기
  const getUserDisplayName = (user: UserInfo): string => {
    return user.name || user.email || '사용자';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Tickity
              </h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/" 
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>
              {!loading && (
                user ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getUserDisplayName(user)}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    로그인
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            블록체인 <span className="text-blue-600 dark:text-blue-400">티켓팅</span>의 미래
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12">
            안전하고 투명한 이벤트 티켓팅을 위한 혁신적인 블록체인 솔루션
          </p>
          
          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <Link
              className="rounded-full bg-blue-600 text-white px-8 py-4 font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              href="/about"
            >
              자세히 알아보기
            </Link>
            <button className="rounded-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-4 font-semibold hover:bg-blue-600 hover:text-white transition-colors">
              지갑 연결
            </button>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              보안
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              블록체인 기술로 위조 불가능한 디지털 티켓
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              투명성
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              모든 거래 내역이 블록체인에 공개적으로 기록
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              빠른 처리
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              실시간 티켓 구매 및 전송
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
