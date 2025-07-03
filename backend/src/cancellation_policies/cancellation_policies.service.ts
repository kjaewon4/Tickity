import { supabase } from '../lib/supabaseClient';

/**
 * 취소정책 텍스트 형태로 조회
 */
export const getCancellationPoliciesText = async (): Promise<string> => {
  try {
    const { data: policiesData, error: policyError } = await supabase
      .from('cancellation_policies')
      .select('period_desc, fee_desc')
      .order('id');

    if (policyError) {
      console.error('취소정책 조회 오류:', policyError);
      return '취소정책 정보를 불러오는 중 오류가 발생했습니다.';
    }

    if (!policiesData || policiesData.length === 0) {
      return '취소정책 정보가 없습니다.';
    }

    const policyTexts = policiesData.map((policy, index) => {
      const feeText = policy.fee_desc === '없음' ? '무료 취소' : `취소 수수료: ${policy.fee_desc}`;
      return `• ${policy.period_desc}: ${feeText}`;
    });

    return policyTexts.join('\n');
  } catch (error) {
    console.error('취소정책 가져오기 오류:', error);
    return '취소정책 정보를 불러오는 중 오류가 발생했습니다.';
  }
};

/**
 * 취소정책 전체 조회
 */
export const getCancellationPolicies = async () => {
  try {
    const { data, error } = await supabase
      .from('cancellation_policies')
      .select('*')
      .order('id');

    if (error) {
      console.error('취소정책 조회 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('취소정책 조회 중 오류:', error);
    throw error;
  }
}; 