import crypto from 'crypto';

// 환경변수에서 암호화 키 가져오기 (실제 운영시에는 더 복잡한 키 사용)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'tickity-encryption-key-32-chars-long!!';
const ALGORITHM = 'aes-256-cbc';

/**
 * 주민번호를 AES로 암호화 (양방향)
 * @param residentNumber - 주민번호 7자리 (예: "950101")
 * @returns 암호화된 값 (IV:암호화된데이터 형태)
 */
export const encryptResidentNumber = (residentNumber: string): string => {
  // 입력 검증
  if (!residentNumber || residentNumber.length !== 7) {
    throw new Error('주민번호는 7자리여야 합니다.');
  }
  
  // 숫자만 허용
  if (!/^\d{7}$/.test(residentNumber)) {
    throw new Error('주민번호는 숫자만 입력 가능합니다.');
  }

  try {
    // 랜덤 IV 생성
    const iv = crypto.randomBytes(16);
    
    // 키를 32바이트로 맞춤
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    // 암호화
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(residentNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV와 암호화된 데이터를 함께 반환
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('주민번호 암호화 오류:', error);
    throw new Error('주민번호 암호화에 실패했습니다.');
  }
};

/**
 * 주민번호 복호화
 * @param encryptedData - 암호화된 데이터 (IV:암호화된데이터 형태)
 * @returns 복호화된 주민번호
 */
export const decryptResidentNumber = (encryptedData: string): string => {
  try {
    // IV와 암호화된 데이터 분리
    const [ivHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !encrypted) {
      throw new Error('잘못된 암호화 데이터 형식입니다.');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    // 복호화
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('주민번호 복호화 오류:', error);
    throw new Error('주민번호 복호화에 실패했습니다.');
  }
};

/**
 * 주민번호 검증 (암호화된 값과 비교)
 * @param inputResidentNumber - 사용자가 입력한 주민번호 7자리
 * @param storedEncryptedData - 데이터베이스에 저장된 암호화된 값
 * @returns 검증 결과
 */
export const verifyResidentNumber = (inputResidentNumber: string, storedEncryptedData: string): boolean => {
  try {
    const decrypted = decryptResidentNumber(storedEncryptedData);
    return inputResidentNumber === decrypted;
  } catch (error) {
    console.error('주민번호 검증 오류:', error);
    return false;
  }
};

/**
 * 암호화된 주민번호에서 생년월일 추출
 * @param encryptedResidentNumber - 암호화된 주민번호
 * @returns 생년월일 정보
 */
export const extractBirthDateFromEncrypted = (encryptedResidentNumber: string): { year: number; month: number; day: number } => {
  try {
    const residentNumber = decryptResidentNumber(encryptedResidentNumber);
    return extractBirthDate(residentNumber);
  } catch (error) {
    console.error('암호화된 주민번호에서 생년월일 추출 오류:', error);
    throw new Error('생년월일 추출에 실패했습니다.');
  }
};

/**
 * 주민번호에서 생년월일 추출
 * @param residentNumber - 주민번호 7자리 (예: "950101")
 * @returns 생년월일 정보
 */
export const extractBirthDate = (residentNumber: string): { year: number; month: number; day: number } => {
  if (!validateResidentNumberFormat(residentNumber)) {
    throw new Error('유효하지 않은 주민번호 형식입니다.');
  }

  const year = parseInt(residentNumber.slice(0, 2));
  const month = parseInt(residentNumber.slice(2, 4));
  const day = parseInt(residentNumber.slice(4, 6));

  // 2000년대 출생자로 가정 (실제로는 성별 정보가 필요하지만 여기서는 간단히)
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  return {
    year: fullYear,
    month,
    day
  };
};

/**
 * 주민번호 유효성 검사 (형식만 확인)
 * @param residentNumber - 주민번호 7자리
 * @returns 유효성 여부
 */
export const validateResidentNumberFormat = (residentNumber: string): boolean => {
  if (!residentNumber || residentNumber.length !== 7) {
    return false;
  }
  
  if (!/^\d{7}$/.test(residentNumber)) {
    return false;
  }

  return true;
};

/**
 * 생년월일을 주민번호 형식으로 변환 (검증용)
 * @param year - 생년 (예: 1995)
 * @param month - 생월 (예: 1)
 * @param day - 생일 (예: 1)
 * @returns 주민번호 7자리 (예: "950101")
 */
export const formatResidentNumber = (year: number, month: number, day: number): string => {
  const yearStr = year.toString().slice(-2); // 1995 → "95"
  const monthStr = month.toString().padStart(2, '0'); // 1 → "01"
  const dayStr = day.toString().padStart(2, '0'); // 1 → "01"
  
  return yearStr + monthStr + dayStr;
}; 