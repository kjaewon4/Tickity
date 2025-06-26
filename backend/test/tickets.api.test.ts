// test/tickets.api.test.ts

import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';
import app from '../src/app';
import { supabase } from '../src/lib/supabaseClient';
import * as ticketService from '../src/tickets/tickets.service';

describe('Tickets API', () => {
  // cancelOnChain 을 stub 해서 항상 고정된 reopenTime 반환
  before(() => {
    sinon.stub(ticketService, 'cancelOnChain').resolves(1711920000);
  });
  after(() => {
    (ticketService.cancelOnChain as sinon.SinonStub).restore();
  });

  // 시드된 티켓 3개 (DB 초기 상태)
  const KNOWN_TICKETS = [
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      concert_id: 'ecbea6fc-9344-4cb4-af5b-0ba1c1e7f636',
      seat_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nft_token_id: '2003',
      token_uri: 'https://ipfs.io/ipfs/QmConcert3VIP003',
      tx_hash: '0x3c4d5e6f7890abcdef1234567890abcdef1234',
      issued_at: '2025-06-22T09:03:35.773071',
      purchase_price: 300000,
      is_used: false,
      canceled_at: null,
      cancellation_fee: null,
      refund_tx_hash: null,
      is_cancelled: false,
      reopen_time: null,
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      concert_id: 'a8eb328a-9191-4ea7-b226-83a85c4f357f',
      seat_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nft_token_id: '2002',
      token_uri: 'https://ipfs.io/ipfs/QmConcert2VIP002',
      tx_hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef123',
      issued_at: '2025-06-20T09:03:35.773071',
      purchase_price: 250000,
      is_used: false,
      canceled_at: null,
      cancellation_fee: null,
      refund_tx_hash: null,
      is_cancelled: false,
      reopen_time: null,
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      concert_id: '4e051989-481e-490e-ba5d-2ead621ff69e',
      seat_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nft_token_id: '2001',
      token_uri: 'https://ipfs.io/ipfs/QmConcert1VIP001',
      tx_hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      issued_at: '2025-06-18T09:03:35.773071',
      purchase_price: 180000,
      is_used: false,
      canceled_at: null,
      cancellation_fee: null,
      refund_tx_hash: null,
      is_cancelled: false,
      reopen_time: null,
    }
  ];

  // ──────────────────────────────────────────────────────────
  describe('GET /tickets', () => {
    it('전체 티켓을 배열로 반환한다', async () => {
      const res = await request(app)
        .get('/tickets')
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an('array').with.lengthOf(KNOWN_TICKETS.length);

      const first = res.body.data[0];
      expect(first).to.include({
        id:            KNOWN_TICKETS[0].id,
        user_id:       KNOWN_TICKETS[0].user_id,
        concert_id:    KNOWN_TICKETS[0].concert_id,
        seat_id:       KNOWN_TICKETS[0].seat_id,
        nft_token_id:  KNOWN_TICKETS[0].nft_token_id,
        token_uri:     KNOWN_TICKETS[0].token_uri,
        tx_hash:       KNOWN_TICKETS[0].tx_hash,
        is_used:       false
      });
      expect(first).to.have.property('is_cancelled');
      expect(first.purchase_price).to.be.a('number');
      expect(first.issued_at).to.be.a('string');
      // issued_at 이 유효한 날짜 문자열인지 확인
      expect(new Date(first.issued_at).toString()).to.not.equal('Invalid Date');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('GET /tickets/my-tickets/:userId', () => {
    it('해당 user_id 의 티켓만 반환한다', async () => {
      const userId = KNOWN_TICKETS[0].user_id;
      const res = await request(app)
        .get(`/tickets/my-tickets/${userId}`)
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data.tickets).to.be.an('array').with.lengthOf(KNOWN_TICKETS.length);
      expect(res.body.data.total).to.equal(KNOWN_TICKETS.length);

      for (const t of res.body.data.tickets) {
        expect(t.user_id).to.equal(userId);
      }
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('POST /tickets', () => {
    // 기존 user/concert/seat 재사용
    const EXISTING_USER_ID    = KNOWN_TICKETS[0].user_id;
    const EXISTING_CONCERT_ID = KNOWN_TICKETS[0].concert_id;
    const EXISTING_SEAT_ID    = KNOWN_TICKETS[0].seat_id;

    const NEW_TICKET: any = {
      user_id:        EXISTING_USER_ID,
      concert_id:     EXISTING_CONCERT_ID,
      seat_id:        EXISTING_SEAT_ID,
      nft_token_id:   '3001',
      token_uri:      'https://ipfs.io/ipfs/QmTestTicket',
      tx_hash:        '0xabc123abc123abc123abc123abc123abc123abcd',
      purchase_price: 123456
    };

    after(async () => {
      // cleanup: 삽입된 티켓 삭제
      await supabase
        .from('tickets')
        .delete()
        .eq('nft_token_id', NEW_TICKET.nft_token_id);
    });

    it('새 티켓을 생성하고 응답으로 반환한다', async () => {
      const res = await request(app)
        .post('/tickets')
        .send(NEW_TICKET)
        .expect(201);

      expect(res.body.success).to.be.true;
      const t = res.body.data;
      expect(t, 'data가 null 입니다').to.exist;    
      expect(t).to.include({
        user_id:        NEW_TICKET.user_id,
        concert_id:     NEW_TICKET.concert_id,
        seat_id:        NEW_TICKET.seat_id,
        nft_token_id:   NEW_TICKET.nft_token_id,
        token_uri:      NEW_TICKET.token_uri,
        tx_hash:        NEW_TICKET.tx_hash,
        purchase_price: NEW_TICKET.purchase_price,
        is_used:        false
      });
      // issued_at 은 문자열, 유효한 날짜여야 함
      expect(t.issued_at).to.be.a('string');
      expect(new Date(t.issued_at).toString()).to.not.equal('Invalid Date');
      expect(t.id).to.be.a('string');
      expect(t.created_at).to.be.a('string');
    });
  });

  // ──────────────────────────────────────────────────────────
  describe('POST /tickets/cancel', () => {
    // 시드된 첫 번째 티켓을 취소 대상으로
    const cancelTarget = KNOWN_TICKETS[0];
    const ticketId   = cancelTarget.id;
    const seatId     = cancelTarget.seat_id;
    const tokenIdNum = parseInt(cancelTarget.nft_token_id, 10);

    it('티켓 취소 요청을 받고 reopenTime 을 반환한다', async () => {
      const res = await request(app)
        .post('/tickets/cancel')
        .send({ seatId, ticketId, tokenId: tokenIdNum })
        .expect(200);

      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('reopenTime', 1711920000);

      // DB 상태도 검증
      const { data: updated } = await supabase
        .from('tickets')
        .select('is_cancelled,reopen_time')
        .eq('id', ticketId)
        .single();
      expect(updated!.is_cancelled).to.be.true;
      expect(updated!.reopen_time).to.equal(1711920000);
    });
  });
});
