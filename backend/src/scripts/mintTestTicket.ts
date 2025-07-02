import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BlockchainService } from '../blockchain/blockchain.service';
import { generateMetadataForTicket } from '../tickets/metadata.service';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 테스트용 콘서트 및 유저
const CONCERT_ID = '551461cc-9a9b-416b-8fdb-eb2ecee020ba';
const USER_ID = '6b305bd5-c07d-4398-95dc-99d7435cea83';

// seat_id → 자동으로 concert_id 기반 AVAILABLE 좌석 중 하나 선택

// seat_number → 해당 seats.label 조회해서 사용

// generateMetadataForTicket() → 자동으로 Supabase에 업로드

// 민팅 결과는 그대로 티켓 테이블에 저장

async function main() {
  try {
    // 1. 사용 가능한 좌석 하나 조회 (concert_seats 기준)
    const { data: seatData, error: seatError } = await supabase
      .from('concert_seats')
      .select('seat_id')
      .eq('concert_id', CONCERT_ID)
      .eq('current_status', 'AVAILABLE')
      .limit(1)
      .maybeSingle(); // 또는 .single()도 가능 (단 결과가 없으면 에러)

    // 오류 처리
    if (seatError) {
      throw new Error('❌ 좌석 조회 실패: ' + seatError.message);
    }
    if (!seatData) {
      throw new Error('❌ 사용 가능한 좌석이 없습니다.');
    }

    const seat_id = seatData.seat_id;

    // 2. 해당 seat_id로 label 가져오기
    const { data: seatInfo, error: labelError } = await supabase
      .from('seats')
      .select('label')
      .eq('id', seat_id)
      .single();

    if (labelError || !seatInfo) {
      throw new Error('❌ 좌석 라벨 조회 실패: ' + labelError?.message);
    }

    const seat_number = seatInfo.label ?? `A-${Math.floor(Math.random() * 100)}`;

    // 3. 티켓 생성
    const payload = {
      concert_id: CONCERT_ID,
      seat_id,
      user_id: USER_ID,
      seat_number,
      purchase_price: 130000, // 원 단위
      created_at: new Date().toISOString(),
    };

    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert(payload)
      .select('*')
      .single();

    if (insertError || !ticket) {
      throw new Error('❌ 티켓 생성 실패: ' + insertError?.message);
    }

    console.log('🎫 티켓 생성 완료:', ticket.id);

    // 4. 메타데이터 생성 및 업로드
    const metadataURI = await generateMetadataForTicket(ticket.id);

    // 5. NFT 민팅
    const blockchain = new BlockchainService();
    const { tokenId, txHash } = await blockchain.mintTicket(
      ticket.user_id,
      1, // 또는 실제 체인용 concert id 넘버
      ticket.seat_number,
      metadataURI,
      ticket.purchase_price.toString()
    );

    // 6. DB 업데이트
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        nft_token_id: tokenId.toString(),
        tx_hash: txHash,
        token_uri: metadataURI,
        issued_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);

    if (updateError) {
      throw new Error('❌ DB 업데이트 실패: ' + updateError.message);
    }

    console.log('✅ 민팅 완료');
    console.log('  • Token ID: ', tokenId);
    console.log('  • Tx Hash:  ', txHash);
    console.log('  • Metadata: ', metadataURI);

  } catch (err: any) {
    console.error('❌ 오류 발생:', err.message);
  }
}

main();
