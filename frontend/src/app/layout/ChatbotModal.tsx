'use client';

import { useEffect, useRef, useState } from 'react';
import { FaCommentDots, FaTimes, FaPaperPlane } from 'react-icons/fa';

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
  // HTML 테이블이 포함된 경우 줄바꿈 변환을 하지 않음
  const hasHTMLTable = content.includes('<table') || content.includes('</table>');
  
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');
  
  // HTML 테이블이 없는 경우에만 줄바꿈을 <br>로 변환
  if (!hasHTMLTable) {
    formatted = formatted.replace(/\n/g, '<br>');
  }
  
  return formatted;
};

// 시간 표시 컴포넌트
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

export default function ChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
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
  const [userId, setUserId] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 사용자 정보 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          setUserId(null);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUserId(data.data.user.id);
          } else {
            setUserId(null);
          }
        } else {
          setUserId(null);
        }
      } catch (e) {
        setUserId(null);
      }
    };
    
    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  // 메시지 전송
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId: userId || undefined,
          chatHistory: messages,
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
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {isOpen ? <FaTimes size={22} /> : <FaCommentDots size={22} />}
      </button>

      {/* 챗봇 모달 */}
      {isOpen && (
        <div
          ref={modalRef}
          className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        >
          {/* 헤더 */}
          <div className="bg-blue-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FaCommentDots size={16} />
              </div>
              <div>
                <h3 className="font-semibold">Tickity 챗봇</h3>
                <p className="text-xs opacity-90">온라인</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-90'
                }`}>
                  <div 
                    className="text-sm leading-relaxed overflow-x-auto" 
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
                          className="block w-full text-left p-2 text-xs bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
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
                <div className="bg-gray-100 rounded-2xl p-3">
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

          {/* 입력 영역 - 맨 밑 고정 */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <FaPaperPlane size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
