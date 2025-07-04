// 파일: src/tickets/metadata.service.ts

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { Buffer } from 'buffer'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * ticketId 하나만 받아서, 관련된 모든 정보를
 * 개별 쿼리로 가져와 메타데이터 JSON을 만들고 업로드합니다.
 */
export async function generateMetadataForTicket(ticketId: string): Promise<string> {
  // ── 1) 티켓 기본 정보 조회 ───────────────────────────────
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('concert_id, seat_id, user_id, seat_number, purchase_price')
    .eq('id', ticketId)
    .single()
  if (ticketErr || !ticket) {
    throw new Error('티켓 조회 실패: ' + ticketErr?.message)
  }

  // ── 2) 콘서트 정보 조회 ─────────────────────────────────
  const { data: concert, error: concertErr } = await supabase
    .from('concerts')
    .select('title, start_date, start_time, poster_url, venue_id')
    .eq('id', ticket.concert_id)
    .single()
  if (concertErr || !concert) {
    throw new Error('콘서트 조회 실패: ' + concertErr?.message)
  }

  // ── 3) 공연장(venue) 정보 조회 ────────────────────────────
  const { data: venue, error: venueErr } = await supabase
    .from('venues')
    .select('name')
    .eq('id', concert.venue_id)
    .single()
  if (venueErr || !venue) {
    throw new Error('공연장 조회 실패: ' + venueErr?.message)
  }

  // ── 4) 사용자 정보 조회 ─────────────────────────────────
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('name')
    .eq('id', ticket.user_id)
    .single()
  if (userErr || !user) {
    throw new Error('유저 조회 실패: ' + userErr?.message)
  }

  // ── 5) 좌석 → 좌석등급 정보 조회 ──────────────────────────
  const { data: seat, error: seatErr } = await supabase
    .from('seats')
    .select('seat_grade_id')
    .eq('id', ticket.seat_id)
    .single()
  if (seatErr || !seat) {
    throw new Error('좌석 조회 실패: ' + seatErr?.message)
  }

  const { data: grade, error: gradeErr } = await supabase
    .from('seat_grades')
    .select('grade_name')
    .eq('id', seat.seat_grade_id)
    .single()
  if (gradeErr || !grade) {
    throw new Error('좌석 등급 조회 실패: ' + gradeErr?.message)
  }

  // ── 6) 메타데이터 객체 생성 ───────────────────────────────
  const metadata = {
    name:        `${concert.title} Ticket`,
    description: `${concert.start_date} ${concert.start_time} - 좌석 ${ticket.seat_number}`,
    image:       concert.poster_url,
    attributes: [
      { trait_type: 'Concert',    value: concert.title },
      { trait_type: 'Date',       value: concert.start_date },
      { trait_type: 'Time',       value: concert.start_time },
      { trait_type: 'Venue',      value: venue.name },
      { trait_type: 'Seat',       value: ticket.seat_number },
      { trait_type: 'Seat_grade', value: grade.grade_name },
      { trait_type: 'TicketNo',   value: ticketId },
      { trait_type: 'Holder',     value: user.name },
      { trait_type: 'Price',      value: `${ticket.purchase_price}원` },
    ]
  }

  // ── 7) JSON → Buffer 변환 후 Storage에 업로드 ─────────────
  const filePath = `tickets/${ticketId}.json`
  const fileBody = Buffer.from(JSON.stringify(metadata), 'utf-8')

  const { error: uploadErr } = await supabase.storage
    .from('metadata')
    .upload(filePath, fileBody, {
      upsert:      true,
      contentType: 'application/json'
    })
  if (uploadErr) {
    throw new Error('메타데이터 업로드 실패: ' + uploadErr.message)
  }

  // ── 8) publicUrl 반환 ───────────────────────────────────
  const { data: urlData } = supabase.storage
    .from('metadata')
    .getPublicUrl(filePath)
  if (!urlData.publicUrl) {
    throw new Error('Public URL 생성 실패')
  }

  return urlData.publicUrl
}