// src/tickets/tickets.controller.ts
import { Router, Request, Response } from 'express';
import * as ticketsService from './tickets.service';
import { generateMetadataForTicket } from './metadata.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ApiResponse } from '../types/auth';
import { supabase } from '../lib/supabaseClient';

const router = Router();
const blockchain = new BlockchainService();

/**
 * 전체 티켓 조회
 * GET /tickets
 */
router.get(
  '/',
  async (_req: Request, res: Response<ApiResponse & { data?: any[] }>) => {
    try {
      const tickets = await ticketsService.getAllTickets();
      res.json({ success: true, data: tickets });
    } catch (err) {
      console.error('전체 티켓 조회 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 조회 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 티켓 발급(예매) (결제 완료 시 호출)
 * POST /tickets
 */
router.post('/', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      concertId,
      sectionId,
      row,
      col,
      userId,
      seatNumber,
      price,
    } = req.body;

    // 입력값 검증
    if (!concertId || !sectionId || row == null || col == null || !userId || !seatNumber || !price) {
      return res.status(400).json({
        success: false,
        error: '필수 입력값이 누락되었습니다.',
      });
    }

    console.log('🎟️ 티켓 생성 요청:', JSON.stringify(req.body, null, 2));

    // 1. seats 테이블에서 seat_id 조회
    const { data: seat, error: seatError } = await supabase
      .from('seats') 
      .select('id') 
      .match({
        section_id: sectionId,
        row_idx: row,
        col_idx: col,
      })
      .single();


    if (seatError || !seat) {
      throw new Error('존재하지 않는 좌석입니다.');
    }

    const seatId = seat.id;

    // 1. DB에 티켓 생성
    const ticket = await ticketsService.createTicket({
      concert_id: concertId,
      seat_id: seatId,
      user_id: userId,
      seat_number: seatNumber,
      price,
    });
    console.log('✅ 티켓 생성 완료, ID:', ticket.id);

    // 2. 메타데이터 생성 → Supabase Storage 업로드
    const metadataURI = await generateMetadataForTicket(ticket.id);

    // 3. NFT 민팅 실행 (seatNumber는 on-chain에 저장됨)
    const { tokenId, txHash } = await blockchain.mintTicket(
      userId,
      Number(concertId),
      seatNumber,
      metadataURI,
      (price / 1e18).toString() // Ether 단위 문자열
    );

    // 4. 민팅 결과 DB에 업데이트
    await ticketsService.updateTicketMintInfo(ticket.id, tokenId, txHash);

    // 5. 응답
    res.status(201).json({
      success: true,
      data: {
        ...ticket,
        token_id: tokenId,
        tx_hash: txHash,
        metadata_uri: metadataURI,
      },
    });
  } catch (err: any) {
    console.error('티켓 발급 오류:', err);
    res.status(500).json({
      success: false,
      error: err.message || '티켓 발급 중 오류가 발생했습니다.',
    });
  }
});


/**
 * 사용자별 예매 티켓 목록 조회
 * GET /tickets/my-tickets/:userId
 */
router.get(
  '/my-tickets/:userId',
  async (
    req: Request,
    res: Response<ApiResponse & { data?: { tickets: any[]; total: number } }>
  ) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, error: '사용자 ID가 필요합니다.' });
      }

      const userTickets = await ticketsService.getUserTickets(userId);
      res.json({
        success: true,
        data: { tickets: userTickets, total: userTickets.length },
      });
    } catch (err) {
      console.error('사용자 티켓 조회 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 목록 조회 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 티켓 취소
 * POST /tickets/cancel
 */
router.post(
  '/cancel',
  async (
    req: Request,
    res: Response<ApiResponse & { data?: { reopenTime: number } }>
  ) => {
    try {
      const { seatId, ticketId, tokenId } = req.body;
      if (!seatId || !ticketId || tokenId == null) {
        return res
          .status(400)
          .json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
      }

      // 1) DB: 좌석 예약 해제
      await ticketsService.setSeatReserved(seatId, false);
      // 2) on-chain: cancelTicket 호출 → reopenTime 반환
      const reopenTime = await ticketsService.cancelOnChain(
        Number(tokenId)
      );
      // 3) DB: 티켓 취소 정보 저장
      await ticketsService.markTicketCancelled(ticketId, reopenTime);

      res.json({ success: true, data: { reopenTime } });
    } catch (err) {
      console.error('티켓 취소 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 취소 처리 중 오류가 발생했습니다.' });
    }
  }
);

export default router;
