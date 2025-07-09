'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import './globals.css';
import { apiClient } from '@/lib/apiClient';
import { UserInfo } from '@/types/auth';
import { Montserrat } from 'next/font/google';

// ✅ Montserrat 폰트 불러오기
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSeatPage = pathname === '/seat';

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);

    if (!token) {
      setLoading(false);
      return;
    }

    const getUser = async () => {
      try {
        const res = await apiClient.getUserWithToken(token);
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('accessToken');
        }
      } catch (err) {
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      if (accessToken) await apiClient.logout(accessToken);
    } catch (err) {
      console.error('로그아웃 오류', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAccessToken(null);
      window.location.reload();
    }
  };

  return (
    <html lang="ko">
      {/* Montserrat 폰트를 전체에 적용 */}
      <body className={montserrat.className}>
        {!isSeatPage && (
          <Navbar user={user} loading={loading} handleLogout={handleLogout} />
        )}

        {/* 네비바가 있는 경우에만 padding 적용 */}
        <main style={!isSeatPage ? { paddingTop: 'var(--navbar-height)' } : {}}>
          {children}
        </main>

        {!isSeatPage && <Footer />}
      </body>
    </html>
  );
}
