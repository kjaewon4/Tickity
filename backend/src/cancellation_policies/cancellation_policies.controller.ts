import { Router, Request, Response } from 'express';
import { getCancellationPolicies, getCancellationPoliciesText } from './cancellation_policies.service';
import { ApiResponse } from '../types/auth';

const router = Router();

/**
 * 취소정책 목록 조회 (JSON 형식)
 * GET /cancellation-policies
 */
router.get('/', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const policies = await getCancellationPolicies();
    res.json({
      success: true,
      data: policies,
      message: '취소정책 조회 성공'
    });
  } catch (err) {
    console.error('취소정책 조회 오류:', err);
    res.status(500).json({
      success: false,
      error: '취소정책 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 취소정책 목록 조회 (텍스트 형식)
 * GET /cancellation-policies/text
 */
router.get('/text', async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const policiesText = await getCancellationPoliciesText();
    res.json({
      success: true,
      data: policiesText,
      message: '취소정책 텍스트 조회 성공'
    });
  } catch (err) {
    console.error('취소정책 텍스트 조회 오류:', err);
    res.status(500).json({
      success: false,
      error: '취소정책 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router; 