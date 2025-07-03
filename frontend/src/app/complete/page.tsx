// src/app/complete/page.tsx
export default function CompletePage({ searchParams }: { searchParams: any }) {
  const { token_id, tx_hash, metadata_uri, seat_number } = searchParams;

  return (
    <main style={{ padding: 24 }}>
      <h1>🎉 티켓 발급 완료</h1>
      <p><strong>좌석:</strong> {seat_number}</p>
      <p><strong>Token ID:</strong> {token_id}</p>
      <p><strong>Tx Hash:</strong> {tx_hash}</p>
      <p>
        <strong>Metadata:</strong>{' '}
        <a href={metadata_uri} target="_blank" rel="noopener noreferrer">
          {metadata_uri}
        </a>
      </p>
    </main>
  );
}
