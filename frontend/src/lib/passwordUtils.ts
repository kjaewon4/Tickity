import { createHash } from 'crypto';

// 간단한 SHA-256 해시 함수 (실제 프로덕션에서는 bcrypt 사용 권장)
export const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

// 비밀번호 검증 함수
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const hashedInput = hashPassword(password);
  return hashedInput === hashedPassword;
}; 