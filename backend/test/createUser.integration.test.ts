// test/createUser.integration.test.ts

import request from 'supertest';
import { expect } from 'chai';
import sinon from 'sinon';

import app from '../src/app';                                      // Express 앱
import { supabase } from '../src/lib/supabaseClient';             // Supabase 클라이언트
import { BlockchainService } from '../src/auth/blockchain.service'; // 지갑 생성 서비스

describe('POST /auth/create-user 통합 테스트', () => {
  let stubGetUser: sinon.SinonStub;
  let stubFrom: sinon.SinonStub;
  let stubCreateWallet: sinon.SinonStub;

  before(() => {
    // 1) supabase.auth.getUser() → 검증된 토큰인 것처럼 목 생성
    stubGetUser = sinon.stub(supabase.auth, 'getUser').resolves({
      data: {
        user: {
          id: 'user-123',
          email: 'foo@bar.com',
          // @supabase/auth-js User 타입 필수 필드
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      },
      error: null
    });

    // 2) supabase.from('users').insert() → 성공하는 목 생성
    const insertStub = sinon.stub().resolves({ error: null });
    stubFrom = sinon.stub(supabase, 'from')
      .withArgs('users')
      .returns({ insert: insertStub } as any);

    // 3) BlockchainService.createUserWallet() → 고정된 지갑 주소/키 반환
    stubCreateWallet = sinon.stub(BlockchainService.prototype, 'createUserWallet')
      .resolves({ address: '0xdeadbeef', privateKey: '0xprivatekey' });
  });

  after(() => {
    sinon.restore();
  });

  it('사용자 생성 시 지갑 생성 후 DB에 저장하고 200 응답 반환', async () => {
    const res = await request(app)
        .post('/auth/create-user')
        .set('Authorization', 'Bearer faketoken')
        .send({
        name: '홍길동',
        resident_number: '9001011',
        password_hash: 'hashed_pw'
    });

    // HTTP 응답 코드 확인
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message').that.includes('생성');

    // **추가**: 생성된 지갑 주소를 콘솔에 찍어 보기
    console.log('생성된 지갑 주소:', res.body.walletAddress);

    // supabase.auth.getUser 호출 확인
    sinon.assert.calledOnce(stubGetUser);
    // 지갑 생성 로직 호출 확인
    sinon.assert.calledOnce(stubCreateWallet);

    // DB insert 확인
    sinon.assert.calledOnce(stubFrom);
    const inserted = (stubFrom.firstCall.returnValue as any).insert.firstCall.args[0][0];
    expect(inserted).to.include({ name: '홍길동', id: 'user-123', email: 'foo@bar.com' });
    expect(inserted).to.have.property('wallet_address', res.body.walletAddress);
    expect(inserted).to.have.property('private_key_encrypted').that.is.a('string');
    expect(inserted).to.have.property('resident_number_encrypted').that.is.a('string');
});

  it('Authorization 헤더가 없으면 401 오류 반환', async () => {
    const res = await request(app)
      .post('/auth/create-user')
      .send({ name: 'A', resident_number: '1234567' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('success', false);
    expect(res.body.error).to.match(/인증 토큰/);
  });
});
