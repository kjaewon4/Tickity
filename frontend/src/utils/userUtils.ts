export const parseResidentNumber = (rrn: string) => {
  if (!rrn || rrn.length < 7) {
    return { birthdate: '', gender: null as 'male' | 'female' | null };
  }

  const yearPrefix = rrn[6] === '1' || rrn[6] === '2' ? '19' : '20';
  const year = `${yearPrefix}${rrn.slice(0, 2)}`;
  const month = parseInt(rrn.slice(2, 4));
  const day = parseInt(rrn.slice(4, 6));
  const gender = rrn[6] === '1' || rrn[6] === '3' ? 'male' : 'female';

  return {
    birthdate: `${year}년 ${month}월 ${day}일`,
    gender: gender as 'male' | 'female',
  };
};