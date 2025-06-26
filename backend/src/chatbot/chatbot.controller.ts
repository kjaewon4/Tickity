import { Router, Request, Response } from 'express';
import { generateChatResponse, saveChatHistory, ChatMessage } from './chatbot.service';
import { ApiResponse } from '../types/auth';
import { supabase } from '../lib/supabaseClient';

const router = Router();

interface ChatRequest {
  message: string;
  userId?: string;
  chatHistory?: ChatMessage[];
}

/**
 * 챗봇과 대화하기
 * POST /chatbot/chat
 */
router.post('/chat', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { message, userId, chatHistory }: ChatRequest = req.body;

    // 입력 검증
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '메시지를 입력해주세요.'
      });
    }

    // 메시지 길이 제한
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '메시지는 1000자 이내로 입력해주세요.'
      });
    }

    // Gemini AI를 통한 응답 생성
    const chatResponse = await generateChatResponse(
      message.trim(),
      userId,
      chatHistory
    );

    // 채팅 히스토리 저장 (사용자 ID가 있는 경우)
    if (userId && chatResponse.message) {
      await saveChatHistory(userId, message.trim(), chatResponse.message);
    }

    res.json({
      success: true,
      data: {
        response: chatResponse.message,
        suggestions: chatResponse.suggestions,
        needsUserInfo: chatResponse.needsUserInfo,
        actionType: chatResponse.actionType,
        timestamp: new Date().toISOString()
      },
      message: '챗봇 응답 생성 성공'
    });

  } catch (error) {
    console.error('챗봇 대화 오류:', error);
    res.status(500).json({
      success: false,
      error: '챗봇 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

/**
 * 사용자별 채팅 히스토리 조회
 * GET /chatbot/history/:userId
 */
router.get('/history/:userId', async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    const { limit = '20' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다.'
      });
    }

    // Supabase에서 채팅 히스토리 조회
    const { data: chatHistory, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) {
      console.error('채팅 히스토리 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '채팅 히스토리 조회 중 오류가 발생했습니다.'
      });
    }

    // 데이터 변환
    const formattedHistory: ChatMessage[] = [];
    
    chatHistory?.forEach(record => {
      // 사용자 메시지
      formattedHistory.push({
        role: 'user',
        content: record.user_message,
        timestamp: new Date(record.created_at)
      });
      
      // 챗봇 응답
      formattedHistory.push({
        role: 'assistant',
        content: record.bot_response,
        timestamp: new Date(record.created_at)
      });
    });

    // 시간순 정렬 (오래된 것부터)
    formattedHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    res.json({
      success: true,
      data: {
        chatHistory: formattedHistory,
        total: formattedHistory.length
      },
      message: '채팅 히스토리 조회 성공'
    });

  } catch (error) {
    console.error('채팅 히스토리 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '채팅 히스토리 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 챗봇 상태 확인
 * GET /chatbot/health
 */
router.get('/health', async (req: Request, res: Response<ApiResponse>) => {
  try {
    // Gemini API 연결 테스트
    const testResponse = await generateChatResponse('안녕하세요');
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        geminiConnected: !!testResponse.message,
        timestamp: new Date().toISOString()
      },
      message: '챗봇 서비스 정상 작동 중'
    });

  } catch (error) {
    console.error('챗봇 상태 확인 오류:', error);
    res.status(503).json({
      success: false,
      error: '챗봇 서비스에 문제가 있습니다.'
    });
  }
});

export default router; 