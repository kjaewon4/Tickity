import { Router } from 'express';
import { getAllSeatGrades, createSeatGrade } from './seat_grades.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const venue_id = req.query.venue_id as string;
    console.log('좌석 등급 조회 요청 - venue_id:', venue_id);
    
    const seatGrades = await getAllSeatGrades(venue_id);
    console.log('조회된 좌석 등급 개수:', seatGrades.length);
    console.log('조회된 좌석 등급 데이터:', seatGrades);
    
    res.json({
      success: true,
      data: seatGrades
    });
  } catch (error) {
    console.error('좌석 등급 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 등급 조회 중 오류가 발생했습니다.'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const grade = await createSeatGrade(req.body);
    if (grade) {
      res.status(201).json({
        success: true,
        data: grade
      });
    } else {
      res.status(400).json({
        success: false,
        error: '좌석 등급 생성에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('좌석 등급 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '좌석 등급 생성 중 오류가 발생했습니다.'
    });
  }
});

export default router; 