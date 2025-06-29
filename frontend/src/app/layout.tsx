'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import './globals.css';
import { apiClient } from '@/lib/apiClient';
import { UserInfo } from '@/types/auth';

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
    }
  };

  return (
    <html lang="ko">
      <body>
        {!isSeatPage && (
          <Navbar user={user} loading={loading} handleLogout={handleLogout} />
        )}
        {children}
        {!isSeatPage && <Footer />}
      </body>
    </html>
  );
}
