import { supabase } from '../lib/supabaseClient';

/**
 * 취소정책 텍스트 형태로 조회
 */
/**
 * 취소정책을 시기별로 정렬하는 함수
 */
const sortPoliciesByPeriod = (policies: any[]) => {
  const order = [
    '예매 후 7일 이내',
    '예매 후 8일~관람일 10일전까지',
    '관람일 9일전~7일전까지',
    '관람일 6일전~3일전까지',
    '관람일 2일전~1일전까지'
  ];

  return policies.sort((a, b) => {
    const aIndex = order.indexOf(a.period_desc);
    const bIndex = order.indexOf(b.period_desc);
    
    // 정의된 순서에 없는 경우 마지막으로 배치
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
};

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

    // 시기별로 정렬
    const sortedPolicies = sortPoliciesByPeriod(policiesData);

    const policyTexts = sortedPolicies.map((policy, index) => {
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

    if (!data || data.length === 0) {
      return [];
    }

    // 시기별로 정렬
    const sortedPolicies = sortPoliciesByPeriod(data);

    return sortedPolicies;
  } catch (error) {
    console.error('취소정책 조회 중 오류:', error);
    throw error;
  }
}; 