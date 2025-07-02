'use client';

interface ConcertSellerSectionProps {
  formData: {
    seller_name: string;
    seller_rep: string;
    seller_reg_no: string;
    seller_email: string;
    seller_contact: string;
    seller_address: string;
    shipping_note: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export default function ConcertSellerSection({
  formData,
  onInputChange
}: ConcertSellerSectionProps) {
  return (
    <div className="space-y-6">
      {/* 판매자 정보 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">판매자 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="seller_name" className="block text-sm font-medium text-gray-700 mb-2">
              판매자명 *
            </label>
            <input
              type="text"
              id="seller_name"
              name="seller_name"
              required
              value={formData.seller_name}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="seller_rep" className="block text-sm font-medium text-gray-700 mb-2">
              대표자 *
            </label>
            <input
              type="text"
              id="seller_rep"
              name="seller_rep"
              required
              value={formData.seller_rep}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="seller_reg_no" className="block text-sm font-medium text-gray-700 mb-2">
              사업자등록번호 *
            </label>
            <input
              type="text"
              id="seller_reg_no"
              name="seller_reg_no"
              required
              placeholder="예: 123-45-67890"
              value={formData.seller_reg_no}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="seller_email" className="block text-sm font-medium text-gray-700 mb-2">
              판매자 이메일 *
            </label>
            <input
              type="email"
              id="seller_email"
              name="seller_email"
              required
              value={formData.seller_email}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="seller_contact" className="block text-sm font-medium text-gray-700 mb-2">
              판매자 전화번호 *
            </label>
            <input
              type="tel"
              id="seller_contact"
              name="seller_contact"
              required
              placeholder="예: 02-1234-5678"
              value={formData.seller_contact}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="seller_address" className="block text-sm font-medium text-gray-700 mb-2">
              판매자 주소 *
            </label>
            <input
              type="text"
              id="seller_address"
              name="seller_address"
              required
              value={formData.seller_address}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 기타 정보 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">기타 정보</h3>
        <div>
          <label htmlFor="shipping_note" className="block text-sm font-medium text-gray-700 mb-2">
            배송/수령 안내 *
          </label>
          <textarea
            id="shipping_note"
            name="shipping_note"
            required
            rows={3}
            placeholder="티켓 수령 방법에 대한 안내를 입력하세요"
            value={formData.shipping_note}
            onChange={onInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
} 