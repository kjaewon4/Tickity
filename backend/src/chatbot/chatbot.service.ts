import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabaseClient';
import { getAllConcerts } from '../concerts/concerts.service';
import { getUserTickets } from '../tickets/tickets.service';

// Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatbotResponse {
  message: string;
  suggestions?: string[];
  needsUserInfo?: boolean;
  actionType?: 'show_concerts' | 'show_tickets' | 'booking_help' | 'general';
}

/**
 * 티켓팅 시스템 컨텍스트 정보
 */
const TICKETING_CONTEXT = `
당신은 Tickity 티켓팅 플랫폼의 고객 지원 챗봇입니다.

주요 기능:
- 콘서트 티켓 예매 및 관리
- NFT 기반 소울바운드 티켓 발행
- 얼굴 인식을 통한 입장 확인
- 블록체인 기반 티켓 진위 확인

답변 가이드라인:
1. 친근하고 도움이 되는 톤으로 답변
2. 티켓팅 관련 질문에 구체적이고 정확한 정보 제공
3. 복잡한 기술 용어는 쉽게 설명
4. 사용자가 원하는 정보를 빠르게 찾을 수 있도록 도움
5. 한국어로 답변

일반적인 질문 유형:
- 콘서트 예매 방법
- 티켓 취소/환불 정책
- NFT 티켓 사용법
- 얼굴 인식 입장 과정
- 좌석 등급별 가격 정보
- 결제 방법 및 문제 해결
`;

/**
 * 사용자 질문을 분석하여 의도 파악
 */
export const analyzeUserIntent = (message: string): {
  intent: string;
  needsData: boolean;
  dataType?: 'concerts' | 'tickets' | 'user_info';
} => {
  const lowerMessage = message.toLowerCase();
  
  // 내 티켓 관련 (더 구체적인 조건을 먼저 확인)
  if (lowerMessage.includes('내 티켓') || lowerMessage.includes('예매 내역') ||
      lowerMessage.includes('구매한') || lowerMessage.includes('마이페이지') ||
      lowerMessage.includes('티켓 목록')) {
    return {
      intent: 'my_tickets',
      needsData: true,
      dataType: 'tickets'
    };
  }
  
  // 콘서트 목록 관련
  if (lowerMessage.includes('콘서트') || lowerMessage.includes('공연') || 
      lowerMessage.includes('예매') || lowerMessage.includes('티켓')) {
    return {
      intent: 'concert_inquiry',
      needsData: true,
      dataType: 'concerts'
    };
  }
  
  // 일반 문의
  return {
    intent: 'general',
    needsData: false
  };
};

/**
 * 콘서트 데이터를 챗봇용 텍스트로 변환
 */
const formatConcertsForAI = async (): Promise<string> => {
  try {
    const concerts = await getAllConcerts();
    
    if (concerts.length === 0) {
      return "현재 예매 가능한 콘서트가 없습니다.";
    }
    
    const concertList = concerts.slice(0, 10).map((concert, index) => {
      return `${index + 1}. ${concert.title}
   - 날짜: ${new Date(concert.date).toLocaleDateString('ko-KR')}
   - 장소: ${concert.location}
   - 출연자: ${concert.main_performer}`;
    }).join('\n\n');
    
    return `현재 예매 가능한 콘서트 목록:\n\n${concertList}`;
  } catch (error) {
    console.error('콘서트 데이터 조회 오류:', error);
    return "콘서트 정보를 불러오는 중 오류가 발생했습니다.";
  }
};

/**
 * 사용자 티켓 데이터를 챗봇용 텍스트로 변환
 */
const formatUserTicketsForAI = async (userId: string): Promise<string> => {
  try {
    const tickets = await getUserTickets(userId);
    
    if (tickets.length === 0) {
      return "현재 예매하신 티켓이 없습니다.";
    }
    
    const ticketList = tickets.map((ticket, index) => {
      const status = ticket.is_used ? '사용됨' : 
                    ticket.canceled_at ? '취소됨' : '예매완료';
      
      return `${index + 1}. ${ticket.concert?.title || '콘서트 정보 없음'}
   - 좌석: ${ticket.seat?.seat_number} (${ticket.seat?.grade_name})
   - 가격: ${ticket.purchase_price.toLocaleString()}원
   - 상태: ${status}
   - 예매일: ${new Date(ticket.created_at).toLocaleDateString('ko-KR')}`;
    }).join('\n\n');
    
    return `회원님의 예매 내역:\n\n${ticketList}`;
  } catch (error) {
    console.error('티켓 데이터 조회 오류:', error);
    return "티켓 정보를 불러오는 중 오류가 발생했습니다.";
  }
};

/**
 * Mock 응답 생성 (API 할당량 초과 시 대체용)
 */
const generateMockResponse = async (
  userMessage: string,
  userId?: string
): Promise<ChatbotResponse> => {
  const { intent, needsData, dataType } = analyzeUserIntent(userMessage);
  
  let message = '';
  let actionType: ChatbotResponse['actionType'] = 'general';
  
  if (intent === 'concert_inquiry') {
    const concerts = await getAllConcerts();
    const concertList = concerts.slice(0, 3).map((concert, index) => 
      `${index + 1}. ${concert.title}\n   📅 ${new Date(concert.date).toLocaleDateString('ko-KR')}\n   📍 ${concert.location}`
    ).join('\n\n');
    
    message = `안녕하세요! Tickity에 오신 것을 환영합니다! 🎵\n\n현재 예매 가능한 인기 콘서트를 안내해드릴게요:\n\n${concertList}\n\n어떤 콘서트에 관심이 있으신가요?`;
    actionType = 'show_concerts';
  } else if (intent === 'my_tickets' && userId) {
    const tickets = await getUserTickets(userId);
    if (tickets.length > 0) {
      const ticketList = tickets.slice(0, 3).map((ticket, index) => 
        `${index + 1}. ${ticket.concert?.title || '콘서트 정보 없음'}\n   🪑 ${ticket.seat?.seat_number || '좌석 정보 없음'} (${ticket.seat?.grade_name || '등급 정보 없음'})\n   💰 ${ticket.purchase_price.toLocaleString()}원`
      ).join('\n\n');
      
      message = `회원님의 예매 내역을 확인해드릴게요! 🎫\n\n${ticketList}\n\n총 ${tickets.length}개의 티켓이 있습니다.`;
          } else {
      message = `아직 예매하신 티켓이 없네요. 🎭\n\n다양한 콘서트가 준비되어 있으니 구경해보세요!`;
    }
    actionType = 'show_tickets';
  } else {
    // 일반 질문들에 대한 응답
    if (userMessage.includes('NFT') || userMessage.includes('nft')) {
      message = `NFT 티켓은 Tickity의 핵심 기능입니다! 🎨\n\n✨ 특징:\n• 블록체인 기반 진위 확인\n• 전송 불가능한 소울바운드 티켓\n• 얼굴 인식으로 안전한 입장\n• 디지털 소장 가치\n\n궁금한 점이 더 있으시면 언제든 물어보세요!`;
    } else if (userMessage.includes('예매') || userMessage.includes('구매')) {
      message = `티켓 예매 방법을 안내해드릴게요! 📋\n\n1️⃣ 원하는 콘서트 선택\n2️⃣ 좌석 등급 및 위치 선택\n3️⃣ 결제 진행\n4️⃣ NFT 티켓 발행\n5️⃣ 얼굴 등록 (입장용)\n\n간단하고 안전한 예매 과정입니다!`;
    } else {
      message = `안녕하세요! Tickity 고객지원 챗봇입니다! 😊\n\n🎵 콘서트 예매 및 관리\n🎫 NFT 기반 티켓 시스템\n👤 얼굴 인식 입장\n🔒 블록체인 보안\n\n무엇을 도와드릴까요?`;
    }
  }
  
  const suggestions = generateSuggestions(intent);
  
  return {
    message,
    suggestions,
    needsUserInfo: intent === 'my_tickets' && !userId,
    actionType
  };
};

/**
 * Gemini AI를 사용한 챗봇 응답 생성
 */
export const generateChatResponse = async (
  userMessage: string,
  userId?: string,
  chatHistory?: ChatMessage[]
): Promise<ChatbotResponse> => {

  try {
    // 사용자 의도 분석
    const { intent, needsData, dataType } = analyzeUserIntent(userMessage);
    
    let contextData = '';
    let actionType: ChatbotResponse['actionType'] = 'general';
    
    // 필요한 데이터 조회
    if (needsData && dataType === 'concerts') {
      contextData = await formatConcertsForAI();
      actionType = 'show_concerts';
    } else if (needsData && dataType === 'tickets' && userId) {
      contextData = await formatUserTicketsForAI(userId);
      actionType = 'show_tickets';
    }
    
    // 채팅 히스토리 구성
    const historyText = chatHistory ? 
      chatHistory.slice(-4).map(msg => 
        `${msg.role === 'user' ? '사용자' : '챗봇'}: ${msg.content}`
      ).join('\n') : '';
    
    // Gemini AI 프롬프트 구성
    const prompt = `
${TICKETING_CONTEXT}

이전 대화:
${historyText}

현재 상황 데이터:
${contextData}

사용자 질문: ${userMessage}

위 정보를 바탕으로 사용자의 질문에 친절하고 정확하게 답변해주세요.
답변은 간결하면서도 도움이 되도록 작성해주세요.
`;

    // Gemini AI 호출
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text();
    
    // 추천 질문 생성
    const suggestions = generateSuggestions(intent);
    
    return {
      message: message.trim(),
      suggestions,
      needsUserInfo: intent === 'my_tickets' && !userId,
      actionType
    };
    
  } catch (error) {
    console.error('Gemini AI 응답 생성 오류:', error);

    
    // API 할당량 초과 또는 기타 오류 시 Mock 응답 사용
    if ((error as any).status === 429 || !process.env.GEMINI_API_KEY) {
      console.log('🤖 Mock 응답으로 대체합니다.');
      return await generateMockResponse(userMessage, userId);
    }
    
    return {
      message: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      suggestions: [
        '콘서트 목록 보기',
        '예매 방법 문의',
        '고객센터 연결'
      ],
      actionType: 'general'
    };
  }
};

/**
 * 의도별 추천 질문 생성
 */
const generateSuggestions = (intent: string): string[] => {
  switch (intent) {
    case 'concert_inquiry':
      return [
        '인기 콘서트 추천해줘',
        '이번 주 콘서트 있어?',
        '좌석 등급별 가격이 궁금해'
      ];
    
    case 'my_tickets':
      return [
        '티켓 취소하고 싶어',
        '환불 정책이 궁금해',
        '티켓 사용 방법 알려줘'
      ];
    
    default:
      return [
        '콘서트 예매 방법',
        'NFT 티켓이 뭐야?',
        '얼굴 인식 입장 과정'
      ];
  }
};

/**
 * 채팅 히스토리 저장 (선택사항)
 */
export const saveChatHistory = async (
  userId: string,
  userMessage: string,
  botResponse: string
): Promise<void> => {
  try {
    await supabase
      .from('chat_history')
      .insert([
        {
          user_id: userId,
          user_message: userMessage,
          bot_response: botResponse,
          created_at: new Date().toISOString()
        }
      ]);
  } catch (error) {
    console.error('채팅 히스토리 저장 오류:', error);
  }
}; 