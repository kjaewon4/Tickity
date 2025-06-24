import { SeatGrade } from './seat_grades.model';

const seatGrades: SeatGrade[] = [];

export const getAllSeatGrades = (): SeatGrade[] => seatGrades;

export const createSeatGrade = (grade: SeatGrade): SeatGrade => {
  seatGrades.push(grade);
  return grade;
}; 