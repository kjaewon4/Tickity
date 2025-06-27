'use client';

import { FC, useState } from 'react';

interface Seat {
  grade: 'VIP' | 'R';
  status: 'available' | 'sold';
}

interface SeatGridProps {
  zoneNumber: string;
  onSeatSelect?: (info: string) => void;
}

// 좌석 구조
const seatMap: Record<string, (Seat | null)[][]> = {
  '43': Array.from({ length: 14 }, (_, rowIdx) =>
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
    })
  ),
};

const getFloorByZone = (zone: string): string => {
  const num = parseInt(zone);
  return num <= 20 ? '1층' : '2층';
};

const SeatGrid: FC<SeatGridProps> = ({ zoneNumber, onSeatSelect }) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const seats = seatMap[zoneNumber];
  const floor = getFloorByZone(zoneNumber);

  const handleSeatClick = (row: number, col: number) => {
    const seat = seats?.[row]?.[col];
    if (!seat || seat.status === 'sold') return;

    const seatKey = `${zoneNumber}구역 ${row + 1}열 ${String(col + 1).padStart(3, '0')}번`;
    setSelectedSeat(seatKey);

    if (onSeatSelect) {
      onSeatSelect(`${floor} ${seatKey}`);
    }
  };

  return (
    <div className="flex gap-6">
      <div className="w-full h-[720px] p-6 flex flex-col items-center justify-start bg-white rounded border shadow overflow-hidden">
        <div className="w-full text-center mb-4">
          <div className="bg-gray-400 text-white py-2 text-base font-bold rounded">
            무대방향 <span className="font-normal">(STAGE)</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            현재 보고 계신 구역은 {floor} {zoneNumber}구역입니다.
          </p>
        </div>

        {seats ? (
          <div className="flex flex-col gap-[6px]">
            {seats.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-[6px]">
                {/* 행 번호 */}
                <div className="w-6 text-right text-sm text-gray-400">{rowIdx + 1}</div>
                {/* 좌석들 */}
                {row.map((seat, colIdx) => {
                  const seatKey = `${zoneNumber}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`;
                  const isSelected = selectedSeat === seatKey;

                  const color =
                    seat === null
                      ? 'bg-transparent border-transparent cursor-default'
                      : seat.status === 'sold'
                      ? 'bg-transparent cursor-default'
                      : isSelected
                      ? 'bg-purple-700 border-black'
                      : 'bg-purple-300 hover:bg-purple-400';

                  return (
                    <div
                      key={colIdx}
                      onClick={() => handleSeatClick(rowIdx, colIdx)}
                      className={`w-8 h-8 border rounded cursor-pointer transition ${color}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 mt-4">
            해당 구역 좌석 데이터가 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatGrid;
