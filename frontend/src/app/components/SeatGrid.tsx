'use client';

import { FC, useEffect, useState, useRef } from 'react';

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
  const [maxCols, setMaxCols] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
          setMaxCols(maxCol + 1);
        }
      } catch (err) {
        console.error('좌석 상태 요청 실패:', err);
      }
    };

    fetchSeats();
  }, [concertId, sectionId]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      // 컨테이너 크기 측정
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    if (typeof window !== 'undefined') {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
      
      // 초기 컨테이너 크기 측정
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      }
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // 컨테이너 크기 변경 감지
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleSeatClick = (rowIdx: number, colIdx: number) => {
    const seat = seatMap[rowIdx]?.[colIdx];
    if (!seat || seat.status === 'sold') return;

    const seatKey = `${zoneCode}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`;
    const seatInfo = `${floor} ${seatKey}`;
    setSelectedSeat(seatKey);

    if (onSeatSelect) {
      onSeatSelect(seatInfo, sectionId, rowIdx, colIdx);
    }  
  };

  let visualRowNumber = 1;

  // 엄격한 반응형 좌석 크기 계산
  const calculateResponsiveSize = () => {
    if (maxCols === 0 || seatMap.length === 0 || containerSize.width === 0) {
      return { seatSize: 'w-8 h-8', gap: 'gap-[6px]', rowWidth: 'w-6', textSize: 'text-sm' };
    }

    // 실제 좌석 행 수 계산
    const actualRows = seatMap.filter(row => row.some(seat => seat !== null)).length;
    
    // 실제 컨테이너 크기 사용 (여유 공간 확보)
    const rowNumberWidth = 40; // 행 번호 영역 (조금 더 여유)
    const padding = 40; // 패딩 증가
    const headerHeight = 100; // 헤더 영역 (줄임)
    const bottomPadding = 30; // 하단 여백 추가
    
    // 사용 가능한 공간 계산 (더 보수적으로)
    const availableWidth = Math.max(200, containerSize.width - rowNumberWidth - padding);
    const availableHeight = Math.max(200, containerSize.height - headerHeight - bottomPadding);
    
    // 좌석 크기 계산 (간격 포함)
    const minGap = 3; // 최소 간격 증가
    
    // 너비 기준 계산
    const widthPerSeat = Math.floor((availableWidth - (maxCols - 1) * minGap) / maxCols);
    
    // 높이 기준 계산  
    const heightPerSeat = Math.floor((availableHeight - (actualRows - 1) * minGap) / actualRows);
    
    // 더 제한적인 크기 선택 (조금 더 보수적으로)
    const seatSize = Math.max(16, Math.min(28, Math.min(widthPerSeat, heightPerSeat)));
    
    // 크기별 클래스 반환 (깔끔한 디자인)
    if (seatSize <= 18) {
      return { 
        seatSize: 'w-4 h-4', 
        gap: `gap-[3px]`,
        rowWidth: 'w-4',
        textSize: 'text-xs'
      };
    } else if (seatSize <= 22) {
      return { 
        seatSize: 'w-5 h-5', 
        gap: `gap-[4px]`,
        rowWidth: 'w-5',
        textSize: 'text-xs'
      };
    } else if (seatSize <= 26) {
      return { 
        seatSize: 'w-6 h-6', 
        gap: `gap-[5px]`,
        rowWidth: 'w-6',
        textSize: 'text-sm'
      };
    } else {
      return { 
        seatSize: 'w-7 h-7', 
        gap: `gap-[6px]`,
        rowWidth: 'w-6',
        textSize: 'text-sm'
      };
    }
  };

  const { seatSize, gap, rowWidth, textSize } = calculateResponsiveSize();

  return (
    <div className="flex gap-6">
      <div 
        ref={containerRef}
        className="w-full min-h-[500px] max-h-[80vh] p-4 sm:p-6 flex flex-col items-center justify-start bg-white rounded border shadow overflow-hidden"
      >
        <div className="w-full text-center mb-4">
          <div className="bg-slate-500 text-white py-2 text-base font-bold rounded">
            무대방향 <span className="font-normal">(STAGE)</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            현재 보고 계신 구역은 {floor} {zoneCode}구역입니다.
          </p>
        </div>
        
        {seatMap.length > 0 ? (
          <div className="flex flex-col items-center justify-start flex-1 w-full overflow-hidden pb-6">
            <div className="flex flex-col items-center max-h-full">
              {seatMap.map((row, rowIdx) => {
                const hasSeats = row.some(seat => seat !== null);
                if (!hasSeats) return null;

                return (
                  <div key={rowIdx} className={`flex items-center ${gap} mb-1`}>
                    <div className={`${rowWidth} ${textSize} text-slate-600 flex items-center justify-center mr-3 font-semibold`}>
                      {visualRowNumber++}
                    </div>
                    <div className={`flex ${gap}`}>
                      {row.map((seat, colIdx) => (
                        <div
                          key={colIdx}
                          onClick={() => handleSeatClick(rowIdx, colIdx)}
                          className={`${seatSize} font-medium rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center ${
                            seat === null
                              ? 'invisible'
                              : seat.status === 'sold'
                              ? 'bg-gray-200 cursor-not-allowed opacity-50'
                              : seat.status === 'hold'
                              ? 'bg-orange-200 cursor-not-allowed opacity-75'
                              : selectedSeat === `${zoneCode}구역 ${rowIdx + 1}열 ${String(colIdx + 1).padStart(3, '0')}번`
                              ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-300'
                              : 'bg-blue-100 hover:bg-blue-200 hover:shadow-md border border-blue-200'
                          }`}
                        >
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-sm text-gray-400">좌석 정보를 불러오는 중입니다…</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatGrid;
