'use client';
              
import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSeatPage = pathname === '/seat';

  return (
    <html lang="ko">
      <body>
        {!isSeatPage && <Navbar />}
        {children}
        {!isSeatPage && <Footer />}
      </body>
    </html>
  );
}
