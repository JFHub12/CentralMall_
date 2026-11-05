import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, X, Bot, User as UserIcon, Globe, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AIChatBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const AIChatBotModal: React.FC<AIChatBotModalProps> = ({ isOpen, onClose, user }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'ai-1',
      sender: 'assistant',
      text: `Hello ${user?.name || 'Student'}! I am Central AI, powered by official knowledge from Central University Ghana (http://central.edu.gh/). Ask me any question about admissions, faculties, fees, hostels, marketplace photos, or campus GPS navigation!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);


  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getClientFallbackReply = (query: string): string => {
    const q = query.toLowerCase().trim();

    if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy)\b/.test(q) || q === 'hi' || q === 'hello') {
      return `🏛️ **Hello & Welcome to Central AI!**

I am your virtual assistant for **Central University Ghana** (Miotso Main Campus - [central.edu.gh](http://central.edu.gh/)).

How can I assist you today?
• 🏠 **Accommodation:** Trinity Hall, Destiny Hall, and off-campus private hostels.
• 🎓 **Admissions:** WASSCE requirements, cut-offs, e-vouchers, and portal links.
• 📚 **Academic Programs:** Law, Business (CBS), Medicine & Pharmacy, Engineering, and FASS.
• 📍 **Campus Navigation:** Locations of Senate Building, Moot Court, Library, and Clinic.
• 🛍️ **Central Mall:** Buying, selling products, uploading pictures, and MoMo payments.

Feel free to ask any question!`;
    }

    if (q.includes('motto') || q.includes('slogan') || q.includes('chancellor') || q.includes('otabil')) {
      return `🏛️ **Central University Identity & Leadership:**
• **Motto:** "Faith, Integrity, Excellence"
• **Founder & Chancellor:** Dr. Mensa Otabil
• **Main Campus:** Miotso Main Campus (Accra-Aflao Highway, near Dawhenya/Prampram)
• **Official Portal:** http://central.edu.gh/`;
    }

    if (q.includes('admission') || q.includes('apply') || q.includes('requirement') || q.includes('voucher') || q.includes('wassce')) {
      return `🎓 **Central University Admissions Guide (http://central.edu.gh/):**
• **WASSCE Requirements:** Passes (A1-C6) in 3 core subjects plus 3 electives (Aggregate 36 or better).
• **E-Voucher:** GH¢200 via https://central.edu.gh/ or USSD *887*9#.
• **Admissions Office:** Senate Building Ground Floor, Miotso Main Campus.`;
    }

    if (q.includes('faculty') || q.includes('course') || q.includes('law') || q.includes('pharmacy') || q.includes('nursing') || q.includes('business') || q.includes('computer')) {
      return `📚 **Faculties & Programs at Central University:**
• **Central Business School (CBS):** B.Sc. Administration (Accounting, Finance, Marketing, HRM).
• **Faculty of Law:** Accredited LL.B with state-of-the-art Moot Court.
• **School of Medicine & Health Sciences:** Pharm D, Nursing, Physician Assistantship.
• **Faculty of Engineering & Applied Sciences:** Computer Science, IT, Civil Engineering, Architecture.`;
    }

    if (q.includes('trinity') || q.includes('destiny') || q.includes('hostel') || q.includes('residence')) {
      return `🏠 **Campus Accommodation & Hostels:**
• **Trinity Hall (TRN-01):** On-campus male residence near Central Clinic.
• **Destiny Hall (DST-01):** On-campus female residence with private study gardens.
• **Off-Campus Hostels:** Private accredited hostels in Dawhenya & Prampram.`;
    }

    if (q.includes('sell') || q.includes('mall') || q.includes('buy') || q.includes('product') || q.includes('picture')) {
      return `🛍️ **Central Mall Marketplace:**
• Click **"+ List Item to Sell"** to publish items.
• Upload custom photos directly from your phone/laptop or paste image URLs.
• Buyers connect directly with sellers via WhatsApp and Mobile Money (MoMo).`;
    }

    return `🏛️ **Central AI Assistant (Central University Ghana):**

Thank you for your question: "*${query}*"

I am ready to help you with:
• **Admissions & Entry Requirements** (WASSCE, cut-off points, e-vouchers)
• **Faculties & Courses** (Law, Business, Pharmacy, Nursing, Computer Science)
• **Campus Navigation & GPS** (Senate Building, Trinity Hall, Destiny Hall, Clinic)
• **Central Mall Marketplace** (Buying, selling, photo uploads)

What specific details would you like to explore next?`;
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      let replyText = '';
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json().catch(() => ({}));
          replyText = data.reply || '';
        }
      }

      if (!replyText) {
        replyText = getClientFallbackReply(text.trim());
      }

      const assistantMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('AI Assistant notice, using client intelligence fallback:', err);
      const fallbackMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'assistant',
        text: getClientFallbackReply(text.trim()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'How do admissions work at Central University (http://central.edu.gh/)?',
    'What faculties and courses are offered at Miotso campus?',
    'How can I insert my own pictures when selling items on Central Mall?',
    'Tell me about Trinity & Destiny student hostels.',
    'Where is the Law Moot Court and Senate Building located?'
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-md">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className={`border w-full sm:max-w-lg h-[85vh] sm:h-[620px] rounded-3xl p-4 md:p-5 flex flex-col shadow-2xl relative overflow-hidden ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/80'
              : 'bg-white border-red-100 text-slate-800 shadow-2xl'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#CE1126] text-white flex items-center justify-center shadow-md shadow-red-200">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-black flex items-center gap-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Central AI Assistant <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </h3>
                <div className={`flex items-center gap-1 text-[10px] font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Globe className="w-3 h-3 text-[#CE1126]" />
                  <a href="http://central.edu.gh/" target="_blank" rel="noreferrer" className="text-[#CE1126] hover:underline font-bold">
                    central.edu.gh
                  </a>
                  <span>• OpenRouter AI Powered</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-ai-chat-modal"
              className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-white bg-slate-800' 
                  : 'text-slate-400 hover:text-slate-800 bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin text-left">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-red-100 text-[#CE1126] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    CU
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#CE1126] text-white rounded-tr-none shadow-sm'
                      : isDark
                        ? 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                  <span
                    className={`block text-[9px] mt-1 ${
                      msg.sender === 'user' ? 'text-white/70 text-right' : isDark ? 'text-slate-400 text-left' : 'text-slate-400 text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs py-2">
                <div className="w-7 h-7 rounded-full bg-red-100 text-[#CE1126] flex items-center justify-center shrink-0 font-bold text-xs">
                  CU
                </div>
                <div className={`px-3 py-2 rounded-2xl flex items-center gap-1.5 border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-1.5 h-1.5 bg-[#CE1126] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#CE1126] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#CE1126] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className={`text-[11px] font-medium ml-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>Central AI is generating answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="pt-2 pb-1 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className={`text-[10px] border px-2.5 py-1 rounded-full font-bold cursor-pointer transition-colors ${
                  isDark 
                    ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-900/60' 
                    : 'bg-red-50 hover:bg-red-100 text-[#CE1126] border-red-200'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`flex items-center gap-2 pt-2 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}
          >
            <input
              type="text"
              placeholder="Ask anything about Central University or general questions..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`flex-1 px-3.5 py-2.5 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:border-[#CE1126] ${
                isDark
                  ? 'bg-slate-800 border border-slate-700 text-slate-100 focus:bg-slate-750'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              id="send-ai-chat-button"
              className="p-2.5 bg-[#CE1126] hover:bg-[#A00D1D] text-white rounded-full shadow-md shadow-red-200 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

      </div>
    </AnimatePresence>
  );
};
