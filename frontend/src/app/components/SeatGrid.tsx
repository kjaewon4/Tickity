'use client';

import { FC, useEffect, useState } from 'react';

interface Seat {
  row: number;
  col: number;
  status: 'available' | 'sold' | 'hold';
  holdExpiresAt: string | null;
}

interface SeatGridProps {
  concertId: string;
  sectionId: string;
  onSeatSelect?: (info: string) => void;
}

const getFloorByZoneCode = (code: string): string => {
  const num = parseInt(code);
  return num <= 20 ? '1층' : '2층';
};

const SeatGrid: FC<SeatGridProps> = ({ concertId, sectionId, onSeatSelect }) => {
  const [seatMap, setSeatMap] = useState<Seat[][]>([]);
  const [floor, setFloor] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  useEffect(() => {
    // if (!concertId || !sectionId || sectionId === 'undefined') return;

    console.log("SeatGrid sectionId:  " + sectionId);
    const fetchSeats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/concerts/${concertId}/${sectionId}/seats`);
        const data = await res.json();

        if (data && data.seatMap) {
          setSeatMap(data.seatMap);
          setFloor(data.floor);
          setZoneCode(data.zoneCode);
        }
      } catch (err) {
        console.error('좌석 상태 요청 실패:', err);
      }
    };

    fetchSeats();
  }, [concertId, sectionId]);

  const handleSeatClick = (row: number, col: number) => {
    const seat = seatMap.find(s => s.row === row && s.col === col);
    if (!seat || seat.status === 'sold') return;

    const seatKey = `${zoneCode}구역 ${row + 1}열 ${String(col + 1).padStart(3, '0')}번`;
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
            현재 보고 계신 구역은 {floor} {zoneCode}구역입니다.
          </p>
        </div>

        {seatMap.length > 0 ? (
          <div className="flex flex-col gap-[6px]">
            {[...Array(14)].map((_, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-[6px]">
                <div className="w-6 text-right text-sm text-gray-400">{rowIdx + 1}</div>
                {[...Array(20)].map((_, colIdx) => {
                  const seat = seatMap.find(s => s.row === rowIdx && s.col === colIdx);
                  if (!seat) return <div key={colIdx} className="w-8 h-8" />;

                  const seatKey = `${zoneCode}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`;
                  const isSelected = selectedSeat === seatKey;

                  const color =
                    seat.status === 'sold'
                      ? 'bg-transparent cursor-default'
                      : seat.status === 'hold'
                      ? 'bg-gray-300 cursor-not-allowed'
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
          <div className="text-center text-sm text-gray-400 mt-4">좌석 정보를 불러오는 중입니다…</div>
        )}
      </div>
    </div>
  );
};

export default SeatGrid;
