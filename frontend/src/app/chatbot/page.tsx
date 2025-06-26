'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatbotResponse {
  response: string;
  suggestions?: string[];
  needsUserInfo?: boolean;
  actionType?: 'show_concerts' | 'show_tickets' | 'booking_help' | 'general';
  timestamp: string;
}

// 마크다운을 HTML로 변환하는 함수
const formatMessage = (content: string): string => {
  return content
    // **텍스트** → <strong>텍스트</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // *텍스트* → <em>텍스트</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // `텍스트` → <code>텍스트</code>
    .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-600 px-1 rounded text-sm">$1</code>')
    // 줄바꿈 처리
    .replace(/\n/g, '<br>');
};

// 시간 표시 컴포넌트 (클라이언트 사이드에서만 렌더링)
function TimeDisplay({ timestamp }: { timestamp: Date }) {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    setTimeString(timestamp.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
  }, [timestamp]);

  return <div className="text-xs opacity-70 mt-1">{timeString}</div>;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '안녕하세요! Tickity 고객지원 챗봇입니다! 😊\n\n🎵 콘서트 예매 및 관리\n🎫 NFT 기반 티켓 시스템\n👤 얼굴 인식 입장\n🔒 블록체인 보안\n\n무엇을 도와드릴까요?',
      timestamp: new Date(),
      suggestions: ['콘서트 목록 보기', '내 티켓 확인', 'NFT 티켓이 뭐야?']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 김민수 사용자 ID (테스트용)
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('네트워크 오류가 발생했습니다.');
      }

      const data = await response.json();
      const botResponse: ChatbotResponse = data.data;

      // 봇 응답 추가
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: botResponse.response,
        timestamp: new Date(),
        suggestions: botResponse.suggestions
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('챗봇 API 오류:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tickity 챗봇
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              티켓팅 관련 궁금한 점을 물어보세요!
            </p>
          </div>

          {/* 채팅 창 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[600px] flex flex-col">
            {/* 메시지 영역 */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <div 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                    <TimeDisplay timestamp={message.timestamp} />
                    
                    {/* 추천 질문 버튼 */}
                    {message.role === 'assistant' && message.suggestions && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((suggestion, suggestionIndex) => (
                          <button
                            key={suggestionIndex}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left p-2 text-sm bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                            disabled={isLoading}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 로딩 인디케이터 */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  전송
                </button>
              </form>
            </div>
          </div>

          {/* 사용자 정보 (테스트용) */}
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            테스트 사용자: 김민수 ({userId})
          </div>
        </div>
      </div>
    </div>
  );
} 