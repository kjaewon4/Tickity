// src/app/complete/page.tsx
export default function CompletePage({ searchParams }: { searchParams: any }) {
  const { token_id, tx_hash, metadata_uri, seat_number } = searchParams;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-600">🎉 티켓 발급 완료</h1>
        
        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-lg">
              <strong className="text-gray-700">좌석:</strong>{' '}
              <span className="text-gray-900">{seat_number}</span>
            </p>
          </div>

          <div className="border-b pb-4">
            <p className="text-lg">
              <strong className="text-gray-700">예매번호:</strong>{' '}
              <span className="font-mono text-gray-900">{token_id}</span>
            </p>
          </div>

          <div className="border-b pb-4">
            <p className="text-sm">
              <strong className="text-gray-700">거래 해시:</strong>{' '}
              <span className="font-mono text-gray-500 break-all">{tx_hash}</span>
            </p>
          </div>

          <div>
            <p className="text-sm">
              <strong className="text-gray-700">메타데이터:</strong>{' '}
              <a 
                href={metadata_uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 break-all"
              >
                {metadata_uri}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/my-tickets" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            내 티켓 보기
          </a>
        </div>
      </div>
    </main>
  );
}
