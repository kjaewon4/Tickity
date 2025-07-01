import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabaseClient';
import { ApiResponse } from '../types/auth';

const router = Router();

// 메모리 스토리지 설정 (파일을 메모리에 저장)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'));
    }
  }
});

// 카테고리별 폴더 매핑
const getCategoryFolder = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    '남자아이돌': 'boy_group',
    '여자아이돌': 'girl_group',
    '내한공연': 'overseas',
    '랩/힙합': 'rap_hiphop',
    '솔로 가수': 'solo'
  };
  
  return categoryMap[category] || 'others';
};

/**
 * 포스터 이미지 업로드
 * POST /uploads/poster
 */
router.post('/poster', upload.single('poster'), async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '업로드할 파일이 없습니다.'
      });
    }

    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        success: false,
        error: '카테고리가 필요합니다.'
      });
    }

    // 파일 정보
    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // 카테고리별 폴더 구조
    const categoryFolder = getCategoryFolder(category);
    const filePath = `${categoryFolder}/${fileName}`;

    // Supabase Storage에 업로드 (실제 버킷 이름 확인 필요)
    const { data, error } = await supabase.storage
      .from('posters') // 'posters' 버킷 사용
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase 업로드 오류:', error);
      return res.status(500).json({
        success: false,
        error: `파일 업로드에 실패했습니다: ${error.message}`
      });
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('posters')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        category: category,
        folder: categoryFolder,
        fileName: fileName
      },
      message: '포스터 이미지 업로드 성공'
    });

  } catch (error: any) {
    console.error('포스터 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '포스터 업로드 중 오류가 발생했습니다.'
    });
  }
});

export default router; 