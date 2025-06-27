import { expect } from 'chai'
import sinon from 'sinon'
import { supabase } from '../src/lib/supabaseClient'
import * as ticketService from '../src/tickets/tickets.service'
import { runReopenJob } from '../src/schedulers/reopen.scheduler'

/**
“재오픈 스케줄러”가 시간이 지난 cancelled 티켓을 찾아서

→ 온체인에서 reopenTicket(tokenId) 을 호출하고

→ DB에서 is_cancelled=false 로 상태를 업데이트

하도록 하는 로직이 정상 작동하는지를 검사하는 테스트
 */

describe('Reopen Scheduler', () => {
  const TEST_TICKET_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const TEST_TOKEN_ID = 9999

  before(async () => {
    // 1) cancelOnChain, markTicketReopened stub
    sinon.stub(ticketService, 'reopenOnChain').resolves()
    sinon.stub(ticketService, 'markTicketReopened').resolves()

    // 2) 재오픈 대상 티켓을 DB에 삽입
    // is_cancelled=true 이고, reopen_time 이 현재 시각보다 10초 전인 티켓을 DB에 넣어서 “재오픈 대상” 으로 만든다
    await supabase.from('tickets').insert([{
      id:            TEST_TICKET_ID,
      user_id:       '550e8400-e29b-41d4-a716-446655440001',
      concert_id:    'ecbea6fc-9344-4cb4-af5b-0ba1c1e7f636',
      seat_id:       'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nft_token_id:  String(TEST_TOKEN_ID),
      token_uri:     '',
      tx_hash:       '0x0',
      issued_at:     new Date().toISOString(),
      purchase_price: 1000,
      is_cancelled:  true,
      reopen_time:   Math.floor(Date.now()/1000) - 10  // 이미 지난 시각
    }])
  })

  after(async () => {
    // DB 정리
    await supabase.from('tickets').delete().eq('id', TEST_TICKET_ID)
    sinon.restore()
  })

  it('reopen_time이 지난 티켓에 대해 reopenOnChain/markTicketReopened를 호출한다', async () => {
    await runReopenJob()

    expect((ticketService.reopenOnChain as sinon.SinonStub).calledWith(TEST_TOKEN_ID)).to.be.true
    expect((ticketService.markTicketReopened as sinon.SinonStub).calledWith(TEST_TICKET_ID)).to.be.true
  })
})
