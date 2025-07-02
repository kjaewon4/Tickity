'use client';

import { FC, useEffect, useState } from 'react';

interface Seat {
  id: string;
  row: number;
  col: number;
  status: 'available' | 'sold' | 'hold';
  holdExpiresAt: string | null;
}

interface SeatGridProps {
  concertId: string;
  sectionId: string;
  onSeatSelect?: (
    info: string,
    sectionId: string,
    row: number,
    column: number
  ) => void;
}

const SeatGrid: FC<SeatGridProps> = ({ concertId, sectionId, onSeatSelect }) => {
  const [seatMap, setSeatMap] = useState<(Seat | null)[][]>([]);
  const [floor, setFloor] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/${sectionId}/seats`);
        const data = await res.json();

        if (data && data.seatMap) {
          const maxRow = Math.max(...data.seatMap.map((s: Seat) => s.row));
          const maxCol = Math.max(...data.seatMap.map((s: Seat) => s.col));

          const grid: (Seat | null)[][] = Array.from({ length: maxRow + 1 }, () =>
            Array.from({ length: maxCol + 1 }, () => null)
          );

          data.seatMap.forEach((seat: Seat) => {
            grid[seat.row][seat.col] = seat;
          });

          setSeatMap(grid);
          setFloor(data.floor);
          setZoneCode(data.zoneCode);
        }
      } catch (err) {
        console.error('좌석 상태 요청 실패:', err);
      }
    };

    fetchSeats();
  }, [concertId, sectionId]);

  const handleSeatClick = (rowIdx: number, colIdx: number) => {
    const seat = seatMap[rowIdx]?.[colIdx];
    if (!seat || seat.status === 'sold') return;

    const seatKey = `${zoneCode}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`;
    const seatInfo = `${floor} ${seatKey}`;
    setSelectedSeat(seatKey);

    if (onSeatSelect) {
      onSeatSelect(seatInfo, sectionId, rowIdx, colIdx); // rowIdx, colIdx 넘기기
    }  
  };

  let visualRowNumber = 1;

  return (
    <div className="flex gap-6">
      <div className="w-full h-[720px] p-6 flex flex-col items-center justify-start bg-white rounded border shadow overflow-hidden">
        <div className="w-full text-center mb-4">
          <div className="bg-gray-400 text-white py-2 text-base font-bold rounded">
            무대방향 <span className="font-normal">(STAGE)</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            현재 보고 계신 구역은 {floor} {zoneCode}구역입니다.
          </p>
        </div>

        {seatMap.length > 0 ? (
          <div className="flex flex-col gap-[6px]">
            {seatMap.map((row, rowIdx) => {
              const isAisle = row.every((cell) => cell === null);
              return (
                <div key={rowIdx} className="flex items-center gap-[6px]">
                  <div className="w-6 text-right text-sm text-gray-400">
                    {!isAisle ? visualRowNumber++ : ''}
                  </div>
                  {row.map((seat, colIdx) =>
                    seat === null ? (
                      <div key={colIdx} className="w-8 h-8" />
                    ) : (
                      <div
                        key={colIdx}
                        onClick={() => handleSeatClick(rowIdx, colIdx)}
                        className={`w-8 h-8 border rounded cursor-pointer transition ${
                          seat.status === 'sold'
                            ? 'bg-transparent cursor-default'
                            : seat.status === 'hold'
                            ? 'bg-gray-300 cursor-not-allowed'
                            : selectedSeat ===
                              `${zoneCode}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`
                            ? 'bg-purple-700 border-black'
                            : 'bg-purple-300 hover:bg-purple-400'
                        }`}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-sm text-gray-400 mt-4">좌석 정보를 불러오는 중입니다…</div>
        )}
      </div>
    </div>
  );
};

export default SeatGrid;
