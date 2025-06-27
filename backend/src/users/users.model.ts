export interface User {
  id: string;
  wallet_address: string;
  name: string;
  email: string;
  password_hash: string;
  resident_number_encrypted: string;  // 주민번호 암호화된 값
  created_at: string;
} 