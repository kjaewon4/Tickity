'use client';

interface SeatGrade {
  id: string;
  grade_name: string;
  default_price: number;
  venue_id: string;
}

interface SeatPrice {
  seat_grade_id: string;
  price: number;
}

interface ConcertBookingSectionProps {
  formData: {
    booking_fee: number | undefined;
    valid_from: string;
    valid_to: string;
    ticket_open_at?: string;
    venue_id?: string;
  };
  seatGrades: SeatGrade[];
  seatPrices: SeatPrice[];
  seatGradesLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSeatPriceChange: (seatGradeId: string, price: number) => void;
}

export default function ConcertBookingSection({
  formData,
  seatGrades,
  seatPrices,
  seatGradesLoading,
  onInputChange,
  onSeatPriceChange
}: ConcertBookingSectionProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* 예매 정보 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">예매 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="booking_fee" className="block text-sm font-medium text-gray-700 mb-2">
              예매 수수료 *
            </label>
            <div className="relative">
              <input
                type="number"
                id="booking_fee"
                name="booking_fee"
                required
                min="0"
                step="10"
                value={formData.booking_fee || ''}
                placeholder="0"
                onChange={onInputChange}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
            </div>
          </div>

          <div>
            <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-2">
              예매 시작일 *
            </label>
            <input
              type="date"
              id="valid_from"
              name="valid_from"
              required
              min={today}
              value={formData.valid_from}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="valid_to" className="block text-sm font-medium text-gray-700 mb-2">
              예매 종료일 *
            </label>
            <input
              type="date"
              id="valid_to"
              name="valid_to"
              required
              min={formData.valid_from || today}
              value={formData.valid_to}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="ticket_open_at" className="block text-sm font-medium text-gray-700 mb-2">
              티켓 오픈 시간 *
            </label>
            <input
              type="time"
              id="ticket_open_at"
              name="ticket_open_at"
              required
              value={formData.ticket_open_at}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 좌석 가격 설정 */}
      {formData.venue_id && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">좌석 가격 설정</h3>
          
          {seatGradesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">좌석 등급 정보를 불러오는 중...</p>
            </div>
          ) : seatGrades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seatGrades.map((grade) => {
                const currentPrice = seatPrices.find(p => p.seat_grade_id === grade.id)?.price || grade.default_price;
                
                return (
                  <div key={grade.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">{grade.grade_name}</h4>
                      <span className="text-sm text-gray-500">
                        기본 가격: {grade.default_price.toLocaleString()}원
                      </span>
                    </div>
                    
                    <div>
                      <label htmlFor={`price-${grade.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                        콘서트 가격 *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          id={`price-${grade.id}`}
                          min="0"
                          step="10"
                          value={currentPrice}
                          onChange={(e) => onSeatPriceChange(grade.id, parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">선택한 공연장에 등록된 좌석 등급이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 