import React from 'react';
import { Concert, CancellationPolicy, TicketInfo } from '../types';

interface ConcertInfoTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ticketInfo: Pick<TicketInfo, 'location' | 'promoter' | 'address' | 'contact' | 'ageLimit'>;
  concert: Concert;
  policies: CancellationPolicy[];
}

const tabs = ['공연정보', '판매정보'];

const ConcertInfoTabs: React.FC<ConcertInfoTabsProps> = ({
  activeTab,
  onTabChange,
  ticketInfo,
  concert,
  policies
}) => {
  return (
    <div className="rounded-2xl p-8">
      <div className="flex space-x-8 border-b border-gray-200 mb-6 text-base font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`pb-3 cursor-pointer ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === '공연정보' ? (
        <div className="min-h-[200px] text-base text-[#444] space-y-6">
          <h3 className="font-semibold text-lg mb-3">콘서트 정보</h3>
          <div className="grid grid-cols-2 gap-y-3">
            <div><span className="text-gray-500 mr-4">장소</span> {ticketInfo.location}</div>
            <div><span className="text-gray-500 mr-4">주최</span> {ticketInfo.promoter}</div>
            <div><span className="text-gray-500 mr-4">주소</span> {ticketInfo.address}</div>
            <div><span className="text-gray-500 mr-4">문의</span> {ticketInfo.contact}</div>
            <div><span className="text-gray-500 mr-4">수용인원</span> {concert.venues?.capacity?.toLocaleString()}명</div>
            <div><span className="text-gray-500 mr-4">관람연령</span> {ticketInfo.ageLimit}</div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-lg mb-3">판매 정보</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full table-fixed text-left text-base">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <th className="w-1/4 bg-gray-50 p-4 font-semibold">주최/기획</th>
                  <td className="w-1/4 p-4">{concert.promoter}</td>
                  <th className="w-1/4 bg-gray-50 p-4 font-semibold">고객문의</th>
                  <td className="w-1/4 p-4">{concert.customer_service}</td>
                </tr>
                <tr>
                  <th className="bg-gray-50 p-4 font-semibold">공연시간</th>
                  <td className="p-4">{concert.running_time}</td>
                  <th className="bg-gray-50 p-4 font-semibold">관람등급</th>
                  <td className="p-4">{concert.age_rating}</td>
                </tr>
                <tr>
                  <th className="bg-gray-50 p-4 font-semibold">주연</th>
                  <td className="p-4">{concert.main_performer}</td>
                  <th className="bg-gray-50 p-4 font-semibold">공연장소</th>
                  <td className="p-4">{concert.venues?.name}</td>
                </tr>
                <tr>
                  <th className="bg-gray-50 p-4 font-semibold">예매수수료</th>
                  <td className="p-4">
                    {concert.booking_fee ? `장당 ${concert.booking_fee.toLocaleString()}원` : '없음'}
                  </td>
                  <th className="bg-gray-50 p-4 font-semibold">배송료</th>
                  <td className="p-4">현장수령 무료, 배송 3,200원</td>
                </tr>
                <tr>
                  <th className="bg-gray-50 p-4 font-semibold">유효기간/이용조건</th>
                  <td colSpan={3} className="p-4">
                    {concert.valid_from} 예매한 공연 날짜, 회차에 한해 이용 가능
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 취소 수수료 정책 */}
          {policies.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-3">취소 수수료 정책</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left table-fixed text-base">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-1/2 p-4 font-semibold border-b border-gray-200">취소일</th>
                      <th className="w-1/2 p-4 font-semibold border-b border-gray-200">취소수수료</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {policies.map((policy, idx) => (
                      <tr key={idx}>
                        <td className="p-4">{policy.period_desc}</td>
                        <td className="p-4">{policy.fee_desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConcertInfoTabs;
