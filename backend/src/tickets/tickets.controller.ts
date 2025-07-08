// src/tickets/tickets.controller.ts
import { Router, Request, Response } from 'express';
import * as ticketsService from './tickets.service';
import { generateMetadataForTicket } from './metadata.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ApiResponse } from '../types/auth';
import { supabase } from '../lib/supabaseClient';
import { keccak256, toUtf8Bytes } from 'ethers';

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

    // 중복 민팅 검증
    const mintingEligibility = await ticketsService.verifyMintingEligibility(userId, concertId);
    if (!mintingEligibility.canMint) {
      return res.status(400).json({
        success: false,
        error: mintingEligibility.error || '이미 해당 공연에 대한 티켓을 보유하고 있습니다.'
      });
    }

    // seats 테이블에서 seat_id 조회
    const seatId = await ticketsService.findSeatIdByPosition(sectionId, row, col);

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
    const metadataURI = await generateMetadataForTicket(ticket.id); // NFT의 tokenURI 역할

    // 원화 → ETH 변환 (toFixed로 지수 표기 방지), 1 ETH = 4,000,000원 기준
    const ethPerWon = 1 / 4_000_000;
    const ethAmount = (price * ethPerWon).toFixed(6); // 소수점 6자리 제한 (지수 표기 방지) 예: "0.033025"

    const concertHash = keccak256(toUtf8Bytes(concertId)); // bytes32 변환

    // 3. NFT 민팅 실행 (seatNumber는 on-chain에 저장됨)
    const { tokenId, txHash } = await blockchain.mintTicket(
      userId,
      concertHash,
      ticket.id,
      seatNumber,
      metadataURI,
      ethAmount // 지수 표기 제거된 string
    );

    // 4. 민팅 결과 DB에 업데이트
    // await ticketsService.updateTicketMintInfo(ticket.id, tokenId, txHash);
    await ticketsService.updateTicketMintInfo(
      ticket.id,
      tokenId,
      txHash,
      concertId,
      seatId,
      userId,
      metadataURI 
    );

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
      const {reopenTime, transactionHash}  = await ticketsService.cancelOnChain(
        Number(tokenId)
      );
      // 3) DB: 티켓 취소 정보 저장
      await ticketsService.markTicketCancelled(ticketId, reopenTime, transactionHash);

      res.json({ success: true, data: { reopenTime } });
    } catch (err) {
      console.error('티켓 취소 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 취소 처리 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 사용자별 예매 티켓 목록 조회 (블록체인 검증 포함)
 * GET /tickets/my-tickets-verified/:userId
 */
router.get(
  '/my-tickets-verified/:userId',
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

      const userTickets = await ticketsService.getUserTicketsWithVerification(userId);
      res.json({
        success: true,
        data: { tickets: userTickets, total: userTickets.length },
      });
    } catch (err) {
      console.error('사용자 티켓 검증 조회 오류:', err);
      res
        .status(500)
        .json({ success: false, error: '티켓 검증 조회 중 오류가 발생했습니다.' });
    }
  }
);

/**
 * 입장 검증
 * POST /tickets/verify-entry
 */
router.post(
  '/verify-entry',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId, userId } = req.body;
      
      if (!tokenId || !userId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID와 사용자 ID가 필요합니다.'
        });
      }

      const verificationResult = await ticketsService.verifyTicketForEntry(
        Number(tokenId),
        userId
      );

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('입장 검증 오류:', err);
      res.status(500).json({
        success: false,
        error: '입장 검증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 민팅 자격 검증
 * POST /tickets/verify-minting
 */
router.post(
  '/verify-minting',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { userId, concertId } = req.body;
      
      if (!userId || !concertId) {
        return res.status(400).json({
          success: false,
          error: '사용자 ID와 콘서트 ID가 필요합니다.'
        });
      }

      const verificationResult = await ticketsService.verifyMintingEligibility(
        userId,
        concertId
      );

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('민팅 자격 검증 오류:', err);
      res.status(500).json({
        success: false,
        error: '민팅 자격 검증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 개별 검증 API들
 */

/**
 * 티켓 소유권 검증
 * POST /tickets/verify-ownership
 */
router.post(
  '/verify-ownership',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId, userId } = req.body;
      
      if (!tokenId || !userId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID와 사용자 ID가 필요합니다.'
        });
      }

      const { blockchainVerification } = await import('../blockchain/verification.service');
      const verificationResult = await blockchainVerification.verifyTicketOwnership(
        Number(tokenId),
        userId
      );

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('소유권 검증 오류:', err);
      res.status(500).json({
        success: false,
        error: '소유권 검증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 티켓 사용 상태 검증
 * POST /tickets/verify-usage
 */
router.post(
  '/verify-usage',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId } = req.body;
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID가 필요합니다.'
        });
      }

      const { blockchainVerification } = await import('../blockchain/verification.service');
      const verificationResult = await blockchainVerification.verifyTicketUsageStatus(
        Number(tokenId)
      );

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('사용 상태 검증 오류:', err);
      res.status(500).json({
        success: false,
        error: '사용 상태 검증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 얼굴 인증 상태 검증
 * POST /tickets/verify-face
 */
router.post(
  '/verify-face',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId, userId } = req.body;
      
      if (!tokenId || !userId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID와 사용자 ID가 필요합니다.'
        });
      }

      const { blockchainVerification } = await import('../blockchain/verification.service');
      const verificationResult = await blockchainVerification.verifyFaceVerificationStatus(
        Number(tokenId),
        userId
      );

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('얼굴 인증 검증 오류:', err);
      res.status(500).json({
        success: false,
        error: '얼굴 인증 검증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * NFT 메타데이터 조회 (블록체인 검증 포함)
 * GET /tickets/metadata/:tokenId
 */
router.get(
  '/metadata/:tokenId',
  async (req: Request, res: Response) => {
    try {
      const { tokenId } = req.params;
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID가 필요합니다.'
        });
      }

      const tokenIdNum = Number(tokenId);
      
      // 토큰 ID 0 필터링
      if (tokenIdNum === 0) {
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 토큰 ID입니다.'
        });
      }

      // 블록체인에서 토큰 URI 조회
      const tokenURI = await blockchain.getTokenURI(tokenIdNum);
      
      if (!tokenURI) {
        return res.status(404).json({
          success: false,
          error: '토큰을 찾을 수 없습니다.'
        });
      }

      // 메타데이터 URL에서 실제 JSON 데이터 가져오기
      const response = await fetch(tokenURI);
      if (!response.ok) {
        throw new Error(`메타데이터 조회 실패: ${response.status}`);
      }

      const metadata = await response.json();
      
      res.json({
        success: true,
        data: metadata
      });

    } catch (err: any) {
      console.error('메타데이터 조회 오류:', err);
      res.status(500).json({
        success: false,
        error: err.message || '메타데이터 조회 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * QR 코드 데이터 생성
 * GET /tickets/qr-data/:ticketId
 */
router.get(
  '/qr-data/:ticketId',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { ticketId } = req.params;
      
      if (!ticketId) {
        return res.status(400).json({
          success: false,
          error: '티켓 ID가 필요합니다.'
        });
      }

      const qrData = await ticketsService.generateQRData(ticketId);
      
      res.json({
        success: true,
        data: qrData
      });

    } catch (err: any) {
      console.error('QR 데이터 생성 오류:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'QR 데이터 생성 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * QR 코드 인증
 * POST /tickets/verify-qr
 */
router.post(
  '/verify-qr',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { qrData } = req.body;
      
      if (!qrData) {
        return res.status(400).json({
          success: false,
          error: 'QR 데이터가 필요합니다.'
        });
      }

      const { verifyQRCode } = await import('./tickets.service');
      const verificationResult = await verifyQRCode(qrData);

      // 검증 결과만 반환 (입장 처리는 별도로 수행)
      console.log('🔍 QR 검증 완료:', {
        isValid: verificationResult.isValid,
        errors: verificationResult.verification.errors
      });

      res.json({
        success: true,
        data: verificationResult
      });

    } catch (err) {
      console.error('QR 코드 인증 오류:', err);
      res.status(500).json({
        success: false,
        error: 'QR 코드 인증 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 입장 처리 전용 엔드포인트
 * POST /tickets/process-entry
 */
router.post(
  '/process-entry',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId, ticketId, userId } = req.body;
      
      if (!tokenId || !ticketId || !userId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID, 티켓 ID, 사용자 ID가 모두 필요합니다.'
        });
      }

      console.log(`🎫 입장 처리 시작: 토큰 ${tokenId}, 티켓 ${ticketId}, 사용자 ${userId}`);

      // 1. 블록체인 입장 처리
      const { BlockchainService } = await import('../blockchain/blockchain.service');
      const blockchainService = new BlockchainService();
      
      let blockchainSuccess = false;
      try {
        await blockchainService.markAsUsed(Number(tokenId));
        console.log(`블록체인 입장 처리 완료: 토큰 ${tokenId}`);
        blockchainSuccess = true;
      } catch (blockchainError) {
        console.error(`블록체인 입장 처리 실패:`, blockchainError);
        return res.status(500).json({
          success: false,
          error: `블록체인 입장 처리 실패: ${blockchainError instanceof Error ? blockchainError.message : '알 수 없는 오류'}`
        });
      }

      // 2. DB 입장 처리 (블록체인 성공 시에만)
      if (blockchainSuccess) {
        try {
          const { error: dbError } = await supabase
            .from('tickets')
            .update({ 
              is_used: true
            })
            .eq('nft_token_id', tokenId)
            .eq('user_id', userId);

          if (dbError) {
            console.error(`DB 입장 처리 실패:`, dbError);
            return res.status(500).json({
              success: false,
              error: `DB 입장 처리 실패: ${dbError.message}`
            });
          } else {
            console.log(`DB 입장 처리 완료: 토큰 ${tokenId}`);
          }
        } catch (dbError) {
          console.error(`DB 입장 처리 중 예외 발생:`, dbError);
          return res.status(500).json({
            success: false,
            error: `DB 입장 처리 중 오류: ${dbError instanceof Error ? dbError.message : '알 수 없는 오류'}`
          });
        }
      }

      res.json({
        success: true,
        data: { 
          message: '입장 처리가 완료되었습니다.',
          tokenId,
          ticketId,
          userId
        }
      });

    } catch (err) {
      console.error('입장 처리 오류:', err);
      res.status(500).json({
        success: false,
        error: '입장 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 티켓 ID로 사용자 ID 조회 (QR 스캔 시 사용)
 * POST /tickets/user-by-ticket
 */
router.post(
  '/user-by-ticket',
  async (req: Request, res: Response<ApiResponse & { data?: { userId: string } }>) => {
    try {
      const { ticketId } = req.body;
      if (!ticketId) {
        return res.status(400).json({
          success: false,
          error: '티켓 ID가 필요합니다.'
        });
      }

      // 티켓 정보 조회
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .select('user_id')
        .eq('id', ticketId)
        .single();

      if (error || !ticketData) {
        console.error('티켓 조회 오류:', error);
        return res.status(404).json({
          success: false,
          error: '티켓을 찾을 수 없습니다.'
        });
      }

      res.json({
        success: true,
        data: { userId: ticketData.user_id }
      });
    } catch (err) {
      console.error('티켓으로 사용자 조회 오류:', err);
      res.status(500).json({
        success: false,
        error: '사용자 조회 중 오류가 발생했습니다.'
      });
    }
  }
);

/**
 * 얼굴 인증 완료 표시 (블록체인)
 * POST /tickets/face-verification-complete
 */
router.post(
  '/face-verification-complete',
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { tokenId, userId, faceHash } = req.body;
      if (!tokenId || !userId) {
        return res.status(400).json({
          success: false,
          error: '토큰 ID와 사용자 ID가 필요합니다.'
        });
      }

      console.log(`🎭 얼굴 인증 완료 처리 시작: 토큰 ID ${tokenId}, 사용자 ID ${userId}, 얼굴 해시: ${faceHash}`);

      // 블록체인에 얼굴 인증 완료 기록 (얼굴 해시 포함)
      try {
        if (faceHash) {
          console.log(`🔐 얼굴 해시 확인됨: ${faceHash}`);
        } else {
          console.log(`⚠️ 얼굴 해시 없음 - 기본 인증 처리`);
        }
        
        // 블록체인에 얼굴 인증 완료 등록
        const txHash = await blockchain.setFaceVerified(Number(tokenId), faceHash);
        console.log(`✅ 블록체인 얼굴 인증 완료: 트랜잭션 ${txHash}`);

        res.json({
          success: true,
          data: { 
            transactionHash: txHash,
            faceHashReceived: !!faceHash
          }
        });
      } catch (blockchainError: any) {
        console.error('❌ 블록체인 얼굴 인증 처리 실패:', blockchainError.message);
        
        // 구체적인 오류 메시지 전달
        res.status(500).json({
          success: false,
          error: `블록체인 얼굴 인증 실패: ${blockchainError.message || blockchainError.reason || '알 수 없는 오류'}`
        });
      }
    } catch (err) {
      console.error('얼굴 인증 완료 처리 오류:', err);
      res.status(500).json({
        success: false,
        error: '얼굴 인증 완료 처리 중 오류가 발생했습니다.'
      });
    }
  }
);

// seats 테이블에서 seat_id 조회
export async function findSeatIdByPosition(sectionId: string, row: number, col: number): Promise<string> {
  const { data: seat, error } = await supabase
    .from('seats')
    .select('id')
    .match({
      section_id: sectionId,
      row_idx: row,
      col_idx: col,
    })
    .single();

  if (error) {
    throw new Error(`좌석 조회 오류: ${error.message}`);
  }

  if (!seat) {
    throw new Error('해당 좌표에 좌석이 없습니다.');
  }

  return seat.id;
}

export default router;
