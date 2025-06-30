'use client';

import { FC, useEffect, useState } from 'react';

interface MapArea {
  id: string; // 🔹 section_id
  code: string; // 🔹 구역 코드 (예: '43', 'F1')
  coords: [number, number][];
}

interface SeatSelectionProps {
  venueId: string | null;
  onSectionSelect: (sectionId: string) => void; // 명확한 이름으로 변경
}

const SeatSelection: FC<SeatSelectionProps> = ({ venueId, onSectionSelect }) => {
  const [mapAreas, setMapAreas] = useState<MapArea[]>([]);
  const originalWidth = 1172;
  const originalHeight = 812;

  useEffect(() => {
    if (!venueId) return;

    const fetchSections = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/sections`);
        const json = await res.json();
        if (json.success && json.data) {
          setMapAreas(json.data); // 🔹 sections 정보 로드
        }
      } catch (err) {
        console.error('구역 정보 불러오기 실패:', err);
      }
    };

    fetchSections();
  }, [venueId]);

  const handleAreaClick = (sectionId: string) => {
    onSectionSelect(sectionId); // 🔹 클릭된 section_id 전달
  };

  return (
    <div className="bg-gray-50 w-full h-full flex flex-col justify-between">
      {/* 이미지 영역 */}
      <div className="w-full max-w-full">
        <div
          className="relative"
          style={{
            width: '100%',
            marginTop: '40px',
            paddingTop: `${(originalHeight / originalWidth) * 100}%`,
          }}
        >
          <img
            src="/images/콘서트-좌석-이미지(KSPO-DOME).jpg"
            alt="Seat Map"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />

          {mapAreas
            .filter((area) => Array.isArray(area.coords) && area.coords.length > 0)
            .map((area) => {
              const polygonCoords = area.coords
                .map(([x, y]) => `${(x / originalWidth) * 100}% ${(y / originalHeight) * 100}%`)
                .join(', ');

              const centerX = area.coords.reduce((sum, [x]) => sum + x, 0) / area.coords.length;
              const centerY = area.coords.reduce((sum, [, y]) => sum + y, 0) / area.coords.length;

              const centerLeft = `${(centerX / originalWidth) * 100}%`;
              const centerTop = `${(centerY / originalHeight) * 100}%`;

              return (
                <div key={area.id} className="absolute top-0 left-0 w-full h-full">
                  {/* 클릭 영역 */}
                  <div
                    className="absolute transition duration-200"
                    style={{
                      clipPath: `polygon(${polygonCoords})`,
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 1,
                    }}
                    onClick={() => handleAreaClick(area.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.2)';
                    }}
                  />

                  {/* 구역 코드 표시 */}
                  <div
                    className="absolute text-white text-xs font-bold drop-shadow-md pointer-events-none"
                    style={{
                      left: centerLeft,
                      top: centerTop,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 2,
                    }}
                  >
                    {area.code}구역
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 안내 메시지 바 */}
      <div className="w-full bg-gray-800 text-white text-sm px-6 py-8 text-center mt-6">
        구역을 먼저 선택해주세요 (화면을 직접 선택하거나 우측 좌석등급을 선택해주세요)
      </div>
    </div>
  );
};

export default SeatSelection;
