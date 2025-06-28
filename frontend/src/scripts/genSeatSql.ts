const fs = require('fs');

/* ───── 변경할 값 ────────────────────────────── */
const SECTION_ID = 'b524b0b1-a2bb-4bcf-830a-9f534d8aa4f3';       // ← sections.id
const GRADE_ID   = 'c67c3c89-b760-439e-8cf0-03e03505ccf3';     // ← seat_grades.id
/* ───────────────────────────────────────────── */

/** 43구역 좌석 배열을 그대로 다시 계산 (기존 SeatGrid 로직 복붙) */
const seatMap43 = Array.from({ length: 14 }, (_, rowIdx) =>
  Array.from({ length: 20 }, (_, colIdx) => {
    if (rowIdx <= 5 && colIdx >= 17) return null;
    if (
      (rowIdx === 0 && [7, 8, 16].includes(colIdx)) ||
      (rowIdx === 1 && [7, 8].includes(colIdx)) ||
      ([2, 3, 4, 5].includes(rowIdx) && colIdx === 8) ||
      (rowIdx === 6 && [9, 14, 15, 16, 17, 18, 19].includes(colIdx)) ||
      (rowIdx === 7 && [9, 15, 16, 17, 18, 19].includes(colIdx)) ||
      (rowIdx === 8 && [9, 15, 16, 17, 18, 19].includes(colIdx)) ||
      ([9, 10, 11, 12].includes(rowIdx) && colIdx === 9) ||
      (rowIdx === 13 && [7, 8, 9].includes(colIdx))
    ) {
      return null;
    }
    return { grade: 'R', status: 'available' };
  }),
);

/* ───── row/col 좌표 평탄화 → VALUES ────────── */
const values = [];
for (let r = 0; r < seatMap43.length; r++) {
  for (let c = 0; c < seatMap43[r].length; c++) {
    if (seatMap43[r][c]) {
      values.push(
        `(gen_random_uuid(),'${SECTION_ID}',${r},${c},'${GRADE_ID}')`
      );
    }
  }
}

/* ───── 완성 SQL 문자열 ─────────────────────── */
const sql = `
-- 43구역 좌석 Rebuild (${values.length}석)
DELETE FROM public.seats
WHERE section_id = '${SECTION_ID}';

INSERT INTO public.seats (id, section_id, row_idx, col_idx, seat_grade_id)
VALUES
  ${values.join(',\n  ')}
;
`.trim();

/* ───── 파일 출력 & 콘솔 안내 ───────────────── */
fs.writeFileSync('seats_43.sql', sql, { encoding: 'utf8' });
console.log('✅ seats_43.sql 생성 완료 (행 수:', values.length, ')');
