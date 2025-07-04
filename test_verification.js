// test_verification.js
// 블록체인 검증 시스템 테스트 스크립트

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// 테스트용 데이터 (실제 데이터로 교체 필요)
const TEST_DATA = {
  userId: '3de4e76c-64df-4756-88c2-0b2640c0351f', // 실제 사용자 ID로 교체
  tokenId: 1, // 실제 토큰 ID로 교체
  concertId: '4e051989-481e-490e-ba5d-2ead621ff69e' // 실제 콘서트 ID로 교체
};

async function testVerificationAPIs() {
  console.log('🧪 블록체인 검증 시스템 테스트 시작\n');

  try {
    // 1. 기본 티켓 목록 조회 테스트
    console.log('1️⃣ 기본 티켓 목록 조회 테스트');
    const ticketsResponse = await axios.get(`${BASE_URL}/tickets`);
    console.log('✅ 기본 티켓 목록 조회 성공');
    console.log(`총 티켓 수: ${ticketsResponse.data.data?.length || 0}\n`);

    // 2. 소유권 검증 테스트
    console.log('2️⃣ 티켓 소유권 검증 테스트');
    const ownershipResponse = await axios.post(`${BASE_URL}/tickets/verify-ownership`, {
      tokenId: TEST_DATA.tokenId,
      userId: TEST_DATA.userId
    });
    console.log('✅ 소유권 검증 성공');
    console.log('검증 결과:', ownershipResponse.data.data);
    console.log('');

    // 3. 사용 상태 검증 테스트
    console.log('3️⃣ 티켓 사용 상태 검증 테스트');
    const usageResponse = await axios.post(`${BASE_URL}/tickets/verify-usage`, {
      tokenId: TEST_DATA.tokenId
    });
    console.log('✅ 사용 상태 검증 성공');
    console.log('검증 결과:', usageResponse.data.data);
    console.log('');

    // 4. 얼굴 인증 상태 검증 테스트
    console.log('4️⃣ 얼굴 인증 상태 검증 테스트');
    const faceResponse = await axios.post(`${BASE_URL}/tickets/verify-face`, {
      tokenId: TEST_DATA.tokenId,
      userId: TEST_DATA.userId
    });
    console.log('✅ 얼굴 인증 검증 성공');
    console.log('검증 결과:', faceResponse.data.data);
    console.log('');

    // 5. 종합 입장 검증 테스트
    console.log('5️⃣ 종합 입장 검증 테스트');
    const entryResponse = await axios.post(`${BASE_URL}/tickets/verify-entry`, {
      tokenId: TEST_DATA.tokenId,
      userId: TEST_DATA.userId
    });
    console.log('✅ 입장 검증 성공');
    console.log('검증 결과:', entryResponse.data.data);
    console.log('');

    // 6. 민팅 자격 검증 테스트
    console.log('6️⃣ 민팅 자격 검증 테스트');
    const mintingResponse = await axios.post(`${BASE_URL}/tickets/verify-minting`, {
      userId: TEST_DATA.userId,
      concertId: TEST_DATA.concertId
    });
    console.log('✅ 민팅 자격 검증 성공');
    console.log('검증 결과:', mintingResponse.data.data);
    console.log('');

    // 7. 블록체인 검증 포함 티켓 목록 테스트
    console.log('7️⃣ 블록체인 검증 포함 티켓 목록 테스트');
    const verifiedTicketsResponse = await axios.get(`${BASE_URL}/tickets/my-tickets-verified/${TEST_DATA.userId}`);
    console.log('✅ 검증 포함 티켓 목록 조회 성공');
    console.log(`총 티켓 수: ${verifiedTicketsResponse.data.data?.total || 0}`);
    
    if (verifiedTicketsResponse.data.data?.tickets?.length > 0) {
      const firstTicket = verifiedTicketsResponse.data.data.tickets[0];
      console.log('첫 번째 티켓 검증 결과:');
      console.log('- 소유권 검증:', firstTicket.verification.ownershipValid);
      console.log('- 사용 상태 검증:', firstTicket.verification.usageStatusValid);
      console.log('- 얼굴 인증 검증:', firstTicket.verification.faceVerificationValid);
      console.log('- 취소 상태 검증:', firstTicket.verification.cancellationStatusValid);
      if (firstTicket.verification.errors.length > 0) {
        console.log('- 검증 오류:', firstTicket.verification.errors);
      }
    }
    console.log('');

    console.log('🎉 모든 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 백엔드 서버가 실행 중인지 확인하세요:');
      console.log('   npm run dev (backend 디렉토리에서)');
    }
    
    if (error.response?.status === 400) {
      console.log('\n💡 테스트 데이터를 실제 데이터로 교체하세요:');
      console.log('   - userId: 실제 사용자 ID');
      console.log('   - tokenId: 실제 NFT 토큰 ID');
      console.log('   - concertId: 실제 콘서트 ID');
    }
  }
}

// 실제 데이터 조회 함수
async function getRealTestData() {
  try {
    console.log('📊 실제 데이터 조회 중...\n');
    
    // 1. 사용자 목록 조회
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data.data || [];
    console.log(`사용자 수: ${users.length}`);
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`테스트 사용자: ${testUser.id} (${testUser.email})`);
      
      // 2. 해당 사용자의 티켓 조회
      const userTicketsResponse = await axios.get(`${BASE_URL}/tickets/my-tickets/${testUser.id}`);
      const tickets = userTicketsResponse.data.data?.tickets || [];
      console.log(`사용자 티켓 수: ${tickets.length}`);
      
      if (tickets.length > 0) {
        const testTicket = tickets[0];
        console.log(`테스트 티켓: ${testTicket.id} (토큰 ID: ${testTicket.nft_token_id})`);
        console.log(`테스트 콘서트: ${testTicket.concert?.id}`);
        
        return {
          userId: testUser.id,
          tokenId: parseInt(testTicket.nft_token_id) || 1,
          concertId: testTicket.concert?.id || 'test-concert'
        };
      }
    }
    
    console.log('⚠️ 실제 데이터가 없어 기본값을 사용합니다.');
    return TEST_DATA;
    
  } catch (error) {
    console.error('실제 데이터 조회 실패:', error.message);
    return TEST_DATA;
  }
}

// 메인 실행
async function main() {
  console.log('🚀 블록체인 검증 시스템 테스트 시작\n');
  
  // 실제 데이터로 업데이트
  const realTestData = await getRealTestData();
  Object.assign(TEST_DATA, realTestData);
  
  console.log('📋 테스트 데이터:');
  console.log(`- 사용자 ID: ${TEST_DATA.userId}`);
  console.log(`- 토큰 ID: ${TEST_DATA.tokenId}`);
  console.log(`- 콘서트 ID: ${TEST_DATA.concertId}\n`);
  
  await testVerificationAPIs();
}

main(); 