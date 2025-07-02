"""
generate_seat_sql.py
────────────────────
01·00 패턴 리스트와 section_id / grade_id만 넣으면

  1) 해당 section 좌석 DELETE
  2) 새 좌석 INSERT (gen_random_uuid())

를 모두 포함한 SQL 문자열을 터미널에 바로 출력합니다.

사용:
    python generate_seat_sql.py > seats_41.sql
    psql -d DBNAME -f seats_41.sql
"""
import textwrap
from uuid import uuid4

# ────────────────────────────────
# 0. 사용자 설정값 (수정하세요)
# ────────────────────────────────
SECTION_ID = 'fb9e8df4-a71b-457c-ad0f-4259f9e1f196'
GRADE_ID   = 'c67c3c89-b760-439e-8cf0-03e03505ccf3'

PATTERN_41 = [
    '00100000000011111110',
    '00100000000111111110',
    '00100000000111111110',
    '00111111110111111110',
    '00111111110111111110',
    '00111111110111111110',
    '00000000000000000000',
    '01111111101111111100',
    '01111111110111111111',
    '01111111110111111111',
    '01111111110111111111',
    '01111111110111111111',
    '00000000000111111111',
    '01100110000111111111',
    '00000000000111111000',
]

# ────────────────────────────────
# 1. 평탄화 및 VALUES 생성
# ────────────────────────────────
values_sql_lines = []
for r, row in enumerate(PATTERN_41):
    for c, ch in enumerate(row):
        if ch == '1':
            values_sql_lines.append(
                f"(gen_random_uuid(),'{SECTION_ID}',{r},{c},'{GRADE_ID}')"
            )

# 줄 개수 확인
total = len(values_sql_lines)
values_block = ',\n      '.join(values_sql_lines)

# ────────────────────────────────
# 2. 전체 SQL 문자열 구성
# ────────────────────────────────
sql = textwrap.dedent(f"""
    -- 41구역 좌석 데이터 Rebuild (총 {total}석)
    DELETE FROM public.seats
    WHERE section_id = '{SECTION_ID}';

    INSERT INTO public.seats (id, section_id, row_idx, col_idx, seat_grade_id)
    VALUES
      {values_block}
    ;
""").strip()

print(sql)
