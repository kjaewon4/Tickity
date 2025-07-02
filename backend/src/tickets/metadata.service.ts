// src/tickets/metadata.service.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadataForTicket(ticketId: string): Promise<string> {
  // 1. 티켓 정보 조회
  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .select('id, seat_number, purchase_price, concert_id, user_id')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticketData) {
    throw new Error('❌ 티켓 조회 실패: ' + ticketError?.message);
  }

  // 2. 콘서트 정보 조회
  const { data: concert, error: concertError } = await supabase
    .from('concerts')
    .select('title, start_date, start_time, poster_url')
    .eq('id', ticketData.concert_id)
    .single();

  if (concertError || !concert) {
    throw new Error('❌ 콘서트 정보 조회 실패: ' + concertError?.message);
  }

  // 3. 사용자 정보 조회
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('id', ticketData.user_id)
    .single();

  if (userError || !user) {
    throw new Error('❌ 사용자 정보 조회 실패: ' + userError?.message);
  }

  // 4. 메타데이터 JSON 구조 생성
  const metadata = {
    name: `${concert.title} Ticket`,
    description: `${concert.start_date} ${concert.start_time} - 좌석 ${ticketData.seat_number}`,
    image: concert.poster_url,
    attributes: [
      { trait_type: 'Concert', value: concert.title },
      { trait_type: 'Seat', value: ticketData.seat_number },
      { trait_type: 'Holder', value: user.name },
      { trait_type: 'Price', value: `${ticketData.purchase_price}원` },
    ],
  };

  // 5. JSON 파일로 Supabase Storage에 업로드
  const blob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json; charset=utf-8',
  });

  const filePath = `tickets/${ticketId}.json`;

  const { error: uploadError } = await supabase.storage
    .from('metadata')
    .upload(filePath, blob, {
      upsert: true,
      contentType: 'application/json',
    });

  if (uploadError) {
    throw new Error('❌ 메타데이터 업로드 실패: ' + uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('metadata')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('❌ public URL 생성 실패');
  }

  console.log('✅ 메타데이터 업로드 완료:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}
