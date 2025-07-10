'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white px-6 py-10 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        {/* 왼쪽 영역 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Tickity</h3>
          <p>고객센터: 1588-1234 (평일 09:00 ~ 18:00)</p>
          <p>이메일: support@tickity.com</p>
        </div>

        {/* 오른쪽 링크 영역 */}
        <div className="flex flex-col sm:flex-row gap-10">
          <div>
            <h4 className="font-semibold mb-2">Tickity</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/about" className="cursor-pointer hover:underline">
                  회사소개
                </Link>
              </li>
              <li>
                <Link href="/careers" className="cursor-pointer hover:underline">
                  채용
                </Link>
              </li>
              <li>
                <Link href="/notice" className="cursor-pointer hover:underline">
                  공지사항
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">고객지원</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/faq" className="cursor-pointer hover:underline">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/guide" className="cursor-pointer hover:underline">
                  예매 가이드
                </Link>
              </li>
              <li>
                <Link href="/contact" className="cursor-pointer hover:underline">
                  1:1 문의
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">법적고지</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/terms" className="cursor-pointer hover:underline">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="cursor-pointer hover:underline">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 mt-10 pt-6 text-center space-y-2">
        <p>
          (주)티키티컴퍼니 | 대표: 3조 | GitHub: https://github.com/kjaewon4/Tickity<br />
        </p>
        <p>© 2025 Tickity Corp. All rights reserved.</p>
      </div>
    </footer>
  );
}
