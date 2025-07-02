// scripts/generateMetadata.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ SERVICE_ROLE 키여야 함
);

async function generateMetadata(ticketId: string) {
  // 예시: Supabase에서 티켓 정보 조회
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id,
      seat_number,
      purchase_price,
      concerts (
        title,
        start_date,
        start_time,
        poster_url
      ),
      users (
        name
      )
    `)
    .eq('id', ticketId)
    .single();


  if (error || !data) {
    console.error('❌ Supabase 조회 실패:', error?.message);
    return;
  }

  const { seat_number, purchase_price, users, concerts } = data;

  // 메타데이터 JSON 구조
  const metadata = {
    name: `${concerts.title} Ticket`,
    description: `${concerts.start_date} ${concerts.start_time} - 좌석 ${seat_number}`,
    image: concerts.poster_url,
    attributes: [
      { trait_type: 'Concert', value: concerts.title },
      { trait_type: 'Seat', value: seat_number },
      { trait_type: 'Holder', value: users?.name || 'Unknown' },
      { trait_type: 'Price', value: `${purchase_price}원` },
    ],
  };

  const blob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json; charset=utf-8',
  });

  const filePath = `tickets/${ticketId}.json`;

  const { error: uploadError } = await supabase.storage
    .from('metadata') // ✅ 버킷명 정확히
    .upload(filePath, blob, {
      upsert: true,
      contentType: 'application/json',
    });

  if (uploadError) {
    console.error('❌ 업로드 실패:', uploadError.message);
    return;
  }

  const { data: publicUrlData } = supabase
    .storage
    .from('metadata')
    .getPublicUrl(filePath);

  console.log('✅ 업로드 성공:', publicUrlData?.publicUrl);
  return publicUrlData?.publicUrl;
}

// 실행용
const ticketId = process.argv[2];
if (!ticketId) {
  console.error('❌ 사용법: ts-node scripts/generateMetadata.ts <ticketId>');
  process.exit(1);
}

generateMetadata(ticketId);
