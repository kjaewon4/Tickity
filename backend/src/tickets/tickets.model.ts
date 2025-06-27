// src/tickets/tickets.model.ts

import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  Default
} from 'sequelize-typescript';

@Table({
  tableName: 'tickets',
  timestamps: false
})
export class Ticket extends Model<Ticket> {
  /** 기본 키 */
  @PrimaryKey
  @Column({ type: DataType.UUID })
  id!: string;

  /** 사용자 ID */
  @Column({ type: DataType.UUID, allowNull: false })
  user_id!: string;

  /** 콘서트 ID */
  @Column({ type: DataType.UUID, allowNull: false })
  concert_id!: string;

  /** 좌석 ID */
  @Column({ type: DataType.UUID, allowNull: false })
  seat_id!: string;

  /** on-chain 토큰 ID (string) */
  @Column({ type: DataType.STRING, allowNull: false })
  nft_token_id!: string;

  /** 메타데이터 URI */
  @Column({ type: DataType.STRING, allowNull: true })
  token_uri!: string | null;

  /** 민팅 트랜잭션 해시 */
  @Column({ type: DataType.STRING, allowNull: false })
  tx_hash!: string;

  /** 발급 일시 */
  @Column({ type: DataType.DATE, allowNull: false })
  issued_at!: Date;

  /** 구매 금액(원) */
  @Column({ type: DataType.INTEGER, allowNull: false })
  purchase_price!: number;

  /** 입장 처리 여부 */
  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_used!: boolean;

  /** 취소 일시 */
  @Column({ type: DataType.DATE, allowNull: true })
  canceled_at!: Date | null;

  /** 취소 수수료(원) */
  @Column({ type: DataType.INTEGER, allowNull: true })
  cancellation_fee!: number | null;

  /** 환불 트랜잭션 해시 */
  @Column({ type: DataType.STRING, allowNull: true })
  refund_tx_hash!: string | null;

  /** 레코드 생성 시각 */
  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false })
  created_at!: Date;

  /** 추가: 취소 중인지 표시 */
  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  is_cancelled!: boolean;

  /** 추가: 언제 재오픈할지 UNIX timestamp */
  @Column({ type: DataType.INTEGER, allowNull: true })
  reopen_time!: number | null;
}
