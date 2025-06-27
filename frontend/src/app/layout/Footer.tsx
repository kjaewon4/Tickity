import { FaTwitter, FaFacebookF, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white px-6 py-10 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
        {/* 왼쪽 영역 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Tickity</h3>
          <p>고객센터: 1588-1234 (평일 09:00 ~ 18:00)</p>
          <p>이메일: support@tickity.com</p>
          <div className="flex gap-4 mt-4 text-xl">
            <FaTwitter className="hover:text-blue-400 cursor-pointer" />
            <FaFacebookF className="hover:text-blue-500 cursor-pointer" />
            <FaInstagram className="hover:text-pink-400 cursor-pointer" />
          </div>
        </div>

        {/* 오른쪽 링크 영역 */}
        <div className="flex flex-col sm:flex-row gap-10">
          <div>
            <h4 className="font-semibold mb-2">Tickity</h4>
            <ul className="space-y-1">
              <li className="cursor-pointer hover:underline">회사소개</li>
              <li className="cursor-pointer hover:underline">채용</li>
              <li className="cursor-pointer hover:underline">공지사항</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">고객지원</h4>
            <ul className="space-y-1">
              <li className="cursor-pointer hover:underline">자주 묻는 질문</li>
              <li className="cursor-pointer hover:underline">예매 가이드</li>
              <li className="cursor-pointer hover:underline">1:1 문의</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">법적고지</h4>
            <ul className="space-y-1">
              <li className="cursor-pointer hover:underline">이용약관</li>
              <li className="cursor-pointer hover:underline">개인정보처리방침</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-600 mt-10 pt-6 text-center space-y-2">
        <p>
          (주)티키티컴퍼니 | 대표: 3조 | 사업자등록번호: 123-45-67890<br />
          서울특별시 강남구 테헤란로 123, 45층
        </p>
        <p>© 2024 Tickity Corp. All rights reserved.</p>
      </div>
    </footer>
  );
}
