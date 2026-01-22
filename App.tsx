
import React, { useState, useRef, useEffect } from 'react';

// Configuration: Replace this with your actual Cloudflare Worker URL
const WORKER_URL = 'https://YOUR_WORKER_URL';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error('فشل في الاتصال بالخادم');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'عذراً، لم أستطع فهم ذلك.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'حدث خطأ أثناء معالجة طلبك. يرجى التأكد من إعدادات الـ Worker ومفتاح OpenAI.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#131314]">
      {/* Header: Logo on Right, Name on Left (RTL context) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#3c4043] bg-[#1e1f20]">
        <img 
          src="logo.png" 
          alt="كليم" 
          className="w-10 h-10 object-contain rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/40/40';
          }}
        />
        <div className="flex items-center">
          <h1 className="text-2xl font-bold gemini-gradient tracking-tight">كليم</h1>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h2 className="text-4xl font-semibold gemini-gradient">أهلاً بك في كليم</h2>
            <p className="text-gray-400 max-w-md">أنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'} animate-fadeIn`}
          >
            <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
              {/* Profile Icon */}
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-sm ${
                msg.sender === 'user' ? 'bg-[#1a73e8] text-white' : 'bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] text-white'
              }`}>
                {msg.sender === 'user' ? 'U' : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                )}
              </div>

              {/* Message Content: Bubble for User, Plain text for AI */}
              <div className={`${
                msg.sender === 'user' 
                  ? 'px-4 py-3 rounded-2xl bg-[#1a73e8] text-white rounded-tr-none shadow-md' 
                  : 'py-1 text-gray-200 leading-relaxed text-[17px] font-light'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 animate-pulse">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
              </div>
              <div className="py-2 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-[#4285f4] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-[#9b72cb] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-[#d96570] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 md:p-6 bg-[#131314]">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center bg-[#1e1f20] border border-[#3c4043] rounded-[28px] overflow-hidden focus-within:border-[#5f6368] focus-within:bg-[#28292a] transition-all px-5 py-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-transparent border-none outline-none text-gray-200 resize-none py-3 px-1 max-h-48 min-h-[48px] text-lg font-light leading-relaxed"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`p-3 rounded-full transition-all duration-200 ${
                inputText.trim() && !isLoading 
                  ? 'bg-white text-black hover:scale-110 active:scale-95' 
                  : 'text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-500 mt-4 tracking-wide opacity-70">
            قد يقدم كليم معلومات غير دقيقة، يرجى التحقق من المعلومات المهمة.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
