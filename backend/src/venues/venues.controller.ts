import { Router, Request, Response } from 'express';
import { 
  getAllVenues, 
  getVenueById, 
  createVenue, 
  updateVenue, 
  deleteVenue
} from './venues.service';
import { ApiResponse } from '../types/auth';

const router = Router();

// 모든 공연장 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const venues = await getAllVenues();
    const response: ApiResponse<typeof venues> = {
      success: true,
      data: venues
    };
    res.json(response);
  } catch (error) {
    console.error('공연장 조회 오류:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '공연장 조회 중 오류가 발생했습니다.'
    };
    res.status(500).json(response);
  }
});

// 특정 공연장 조회
router.get('/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const venue = await getVenueById(venueId);
    
    if (!venue) {
      const response: ApiResponse<null> = {
        success: false,
        error: '공연장을 찾을 수 없습니다.'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof venue> = {
      success: true,
      data: venue
    };
    res.json(response);
  } catch (error) {
    console.error('공연장 조회 오류:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '공연장 조회 중 오류가 발생했습니다.'
    };
    res.status(500).json(response);
  }
});

// 새로운 공연장 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const venueData = req.body;
    
    // 필수 필드 검증
    if (!venueData.name || !venueData.address) {
      const response: ApiResponse<null> = {
        success: false,
        error: '공연장 이름과 주소는 필수입니다.'
      };
      return res.status(400).json(response);
    }

    const newVenue = await createVenue(venueData);
    
    if (!newVenue) {
      const response: ApiResponse<null> = {
        success: false,
        error: '공연장 생성에 실패했습니다.'
      };
      return res.status(500).json(response);
    }

    const response: ApiResponse<typeof newVenue> = {
      success: true,
      data: newVenue
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('공연장 생성 오류:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '공연장 생성 중 오류가 발생했습니다.'
    };
    res.status(500).json(response);
  }
});

// 공연장 정보 수정
router.put('/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const updateData = req.body;
    
    const updatedVenue = await updateVenue(venueId, updateData);
    
    if (!updatedVenue) {
      const response: ApiResponse<null> = {
        success: false,
        error: '공연장을 찾을 수 없습니다.'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof updatedVenue> = {
      success: true,
      data: updatedVenue
    };
    res.json(response);
  } catch (error) {
    console.error('공연장 수정 오류:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '공연장 수정 중 오류가 발생했습니다.'
    };
    res.status(500).json(response);
  }
});

// 공연장 삭제
router.delete('/:venueId', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const deleted = await deleteVenue(venueId);
    
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: '공연장을 찾을 수 없습니다.'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      data: null
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('공연장 삭제 오류:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: '공연장 삭제 중 오류가 발생했습니다.'
    };
    res.status(500).json(response);
  }
});

export default router; 