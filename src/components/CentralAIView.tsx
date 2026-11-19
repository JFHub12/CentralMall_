import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  ArrowUp,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Download,
  Image as ImageIcon,
  BookOpen,
  Code2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Wand2,
  History,
  Plus,
  Search,
  PanelLeft,
  SquarePen,
  Library,
  Compass,
  Folder,
  PenLine,
  Globe,
  AudioLines,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { useTheme, ThemeToggle } from '../context/ThemeContext';

interface CentralAIViewProps {
  user: any;
  onBackToDashboard: () => void;
}

type WorkspaceView = 'chat' | 'image' | 'research' | 'code' | 'library' | 'explore';

interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mode?: WorkspaceView;
  imageUrl?: string;
  imagePrompt?: string;
  imageStyle?: string;
  quickActions?: string[];
  isResearchPaper?: boolean;
}

interface GeneratedImageItem {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  timestamp: string;
}

interface ChatHistorySession {
  id: string;
  title: string;
  updatedAt: string;
  mode: WorkspaceView;
  messages: AIMessage[];
}

export const CentralAIView: React.FC<CentralAIViewProps> = ({ user, onBackToDashboard }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Active View & Sidebar States
  const [activeView, setActiveView] = useState<WorkspaceView>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [showSidebarSearch, setShowSidebarSearch] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Think / Deep Reasoning toggle inside composer
  const [thinkEnabled, setThinkEnabled] = useState(false);

  // Persistent Chat History scoped per user
  const historyStorageKey = `central_ai_history_${user?.email || 'guest'}`;
  const [historySessions, setHistorySessions] = useState<ChatHistorySession[]>(() => {
    try {
      const saved = localStorage.getItem(`central_ai_history_${user?.email || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `session-${Date.now()}`);

  // Active conversation messages (empty array triggers the clean "Where should we begin?" hero!)
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Speech / Voice States
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Image Studio State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<
    'photorealistic' | 'cinematic' | 'anime' | 'digital-art' | '3d-render' | 'cyberpunk' | 'oil-painting'
  >('photorealistic');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([
    {
      id: 'preset-img-1',
      imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1200',
      prompt: 'Central University Main Senate Building and academic quadrangle illuminated under evening golden hour',
      style: 'photorealistic',
      aspectRatio: '16:9',
      timestamp: 'Today',
    },
    {
      id: 'preset-img-2',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
      prompt: 'Modern university students collaborating in a high-tech digital laboratory with holographic study tablets',
      style: 'cinematic',
      aspectRatio: '16:9',
      timestamp: 'Yesterday',
    },
  ]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Deep Research State
  const [researchTopic, setResearchTopic] = useState('');
  const [researchFocus, setResearchFocus] = useState<'academic' | 'economic' | 'scientific' | 'legal'>('academic');
  const [researching, setResearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Auto-save active session to History whenever user sends messages
  useEffect(() => {
    const firstUserMsg = messages.find((m) => m.sender === 'user');
    if (!firstUserMsg) return;

    const cleanTitle = firstUserMsg.text
      .replace(/[*#_`🔬🎨💬]/g, '')
      .replace(/^Deep Academic Research Request:\s*/i, '')
      .trim();
    const title = cleanTitle.length > 44 ? `${cleanTitle.slice(0, 44)}...` : cleanTitle || 'CentralAI Conversation';
    const updatedAt = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setHistorySessions((prev) => {
      const others = prev.filter((s) => s.id !== currentSessionId);
      const next: ChatHistorySession[] = [
        {
          id: currentSessionId,
          title,
          updatedAt,
          mode: activeView,
          messages,
        },
        ...others,
      ].slice(0, 40);

      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(next));
      } catch {
        // Ignore quota errors
      }
      return next;
    });
  }, [messages, currentSessionId, activeView, historyStorageKey]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filtered recents & projects
  const filteredRecents = historySessions.filter((s) =>
    !sidebarSearchQuery.trim()
      ? true
      : s.title.toLowerCase().includes(sidebarSearchQuery.trim().toLowerCase())
  );
  const projectSessions = historySessions.filter((s) => s.mode === 'research' || s.mode === 'code');

  // Text-To-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*#_`>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Microphone Input
  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice('Voice recognition is not supported in this browser. Type your prompt below.');
      setTimeout(() => setVoiceNotice(null), 3500);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartNewChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setCurrentSessionId(`session-${Date.now()}`);
    setMessages([]);
    setActiveView('chat');
    setShowPlusMenu(false);
    setIsHistoryDrawerOpen(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleLoadHistorySession = (session: ChatHistorySession) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setActiveView('chat');
    setIsHistoryDrawerOpen(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteHistorySession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistorySessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (sessionId === currentSessionId) {
      setCurrentSessionId(`session-${Date.now()}`);
      setMessages([]);
    }
  };

  const handleClearAllHistory = () => {
    setHistorySessions([]);
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {}
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const formatted = messages
      .map((m) => {
        const role = m.sender === 'user' ? user?.name || 'User' : 'CentralAI';
        return `[${m.timestamp}] ${role}:\n${m.text}\n${m.imageUrl ? `[Generated Image: ${m.imageUrl}]\n` : ''}`;
      })
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CentralAI_Chat_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Image Generation Handler
  const handleGenerateImage = async (customPrompt?: string, appendToChat = true) => {
    const targetPrompt = (customPrompt || imagePrompt).trim();
    if (!targetPrompt) return;

    setGeneratingImage(true);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
        }),
      });

      const data = await res.json();
      if (data && data.success && data.imageUrl) {
        const newItem: GeneratedImageItem = {
          id: data.id || `img-${Date.now()}`,
          imageUrl: data.imageUrl,
          prompt: data.prompt,
          style: data.style,
          aspectRatio: data.aspectRatio,
          timestamp: 'Just now',
        };
        setGallery((prev) => [newItem, ...prev]);

        if (appendToChat) {
          const imageMsg: AIMessage = {
            id: `msg-img-${Date.now()}`,
            sender: 'assistant',
            text: `Generated artwork for: "${data.prompt}" (${data.style}, ${data.aspectRatio})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'image',
            imageUrl: data.imageUrl,
            imagePrompt: data.prompt,
            imageStyle: data.style,
          };
          setMessages((prev) => [...prev, imageMsg]);
        }
        setImagePrompt('');
      } else {
        setVoiceNotice(data?.message || 'Image generation failed. Please try again.');
        setTimeout(() => setVoiceNotice(null), 3500);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setVoiceNotice('Unable to reach image server right now.');
      setTimeout(() => setVoiceNotice(null), 3500);
    } finally {
      setGeneratingImage(false);
    }
  };

  // Deep Academic Research Handler
  const handleConductResearch = async (customTopic?: string) => {
    const targetTopic = (customTopic || researchTopic).trim();
    if (!targetTopic) return;

    setResearching(true);
    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `Deep Research: ${targetTopic} (${researchFocus})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: 'research',
    };

    setMessages((prev) => [...prev, userMsg]);
    setResearchTopic('');
    setActiveView('chat');

    try {
      const res = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic, focus: researchFocus }),
      });

      const data = await res.json();
      const replyText = data?.research || 'Research analysis complete.';

      const researchMsg: AIMessage = {
        id: `ai-research-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'research',
        isResearchPaper: true,
        quickActions: [
          'Generate an illustration for this topic',
          'Summarize in 3 key takeaways',
          'List academic references & next steps',
        ],
      };

      setMessages((prev) => [...prev, researchMsg]);
    } catch (err) {
      console.error('Research error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Could not complete deep research query right now. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setResearching(false);
    }
  };

  // Primary Chat Send Handler
  const handleSendMessage = async (textOverride?: string) => {
    const raw = (textOverride || inputText).trim();
    if (!raw) return;

    setShowPlusMenu(false);
    if (activeView !== 'chat') {
      setActiveView('chat');
    }

    const lower = raw.toLowerCase();
    if (
      lower.startsWith('generate image of') ||
      lower.startsWith('generate an image of') ||
      lower.startsWith('create an image of') ||
      lower.startsWith('draw a') ||
      lower.startsWith('/image')
    ) {
      const promptToGen = raw
        .replace(/^\/image\s*/i, '')
        .replace(/^generate an? image of\s*/i, '')
        .replace(/^create an? image of\s*/i, '')
        .replace(/^draw an?\s*/i, '');

      const userMsg: AIMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: raw,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'image',
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      await handleGenerateImage(promptToGen, true);
      return;
    }

    // If "Think" toggle is active on a fresh prompt, route through Deep Research or enhanced reasoning
    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: raw,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: thinkEnabled ? 'research' : 'chat',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInputText('');
    setLoading(true);

    try {
      if (thinkEnabled) {
        const res = await fetch('/api/ai/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: raw, focus: 'academic' }),
        });
        const data = await res.json();
        const replyText = data?.research || 'Analysis complete.';
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-think-${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'research',
            isResearchPaper: true,
            quickActions: ['Summarize key takeaways', 'Generate an illustration for this'],
          },
        ]);
      } else {
        const historyPayload = messages.slice(-8).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));
        historyPayload.push({ role: 'user', content: raw });

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: raw,
            messages: historyPayload,
          }),
        });

        const data = await res.json();
        const replyText = data?.reply || 'CentralAI is online. How else can I assist you?';

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mode: 'chat',
            quickActions: ['Explain more simply', 'Generate an image based on this', 'Run deep research on this'],
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Temporary network issue. Please ask your question again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Shared Rounded Pill Composer (Matches Reference Screenshot)
  const renderPillComposer = (centered = false) => (
    <div className={`relative w-full ${centered ? 'max-w-[680px]' : 'max-w-3xl mx-auto'}`}>
      {/* Plus Popover Menu */}
      <AnimatePresence>
        {showPlusMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className={`absolute left-0 ${
              centered ? 'top-full mt-2' : 'bottom-full mb-2'
            } w-64 rounded-2xl border p-1.5 shadow-2xl z-30 ${
              isDark ? 'bg-[#18181b] border-white/10 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                setActiveView('image');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#ff073a]" />
              <span>Open Image Studio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                setActiveView('research');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#ff073a]" />
              <span>Deep Academic Research</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                setActiveView('code');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
            >
              <Code2 className="w-4 h-4 text-[#ff073a]" />
              <span>Code & STEM Solver</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPlusMenu(false);
                setIsHistoryDrawerOpen(true);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4 text-[#ff073a]" />
              <span>Browse Saved History</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className={`flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-full border transition-all ${
          isDark
            ? 'bg-[#18181b] border-white/10 focus-within:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.45)]'
            : 'bg-slate-100/90 border-slate-200 focus-within:border-slate-300 focus-within:bg-white shadow-sm'
        }`}
      >
        {/* Plus Button */}
        <button
          type="button"
          onClick={() => setShowPlusMenu((p) => !p)}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            isDark ? 'text-zinc-300 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="More CentralAI tools"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Prompt Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder={thinkEnabled ? 'Ask for deep academic reasoning...' : 'Ask CentralAI'}
          className={`flex-1 min-w-0 bg-transparent text-sm md:text-[15px] focus:outline-none ${
            isDark ? 'text-white placeholder-zinc-400' : 'text-slate-900 placeholder-slate-500'
          }`}
        />

        {/* Think / Deep Research Pill Toggle */}
        <button
          type="button"
          onClick={() => setThinkEnabled((t) => !t)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
            thinkEnabled
              ? 'bg-[#ff073a]/20 text-[#ff3366] border border-[#ff073a]/50'
              : isDark
              ? 'text-zinc-300 hover:bg-white/10 hover:text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Toggle Deep Research & Thinking Mode"
        >
          <Brain className="w-4 h-4" />
          <span>Think</span>
        </button>

        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleToggleVoiceInput}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            isListening
              ? 'bg-[#ff073a] text-white animate-pulse'
              : isDark
              ? 'text-zinc-300 hover:bg-white/10 hover:text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
          title={isListening ? 'Listening...' : 'Voice input'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Circular Submit / Voice Wave Action Button */}
        {inputText.trim() ? (
          <button
            type="submit"
            disabled={loading}
            className="w-9 h-9 rounded-full bg-[#CE1126] hover:bg-[#ff073a] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:opacity-40 shadow-md"
            title="Send message"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className="w-9 h-9 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md"
            title="Start voice prompt"
          >
            <AudioLines className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CU';

  return (
    <div
      className={`fixed inset-0 z-20 w-screen h-screen flex overflow-hidden select-none sm:select-text transition-colors duration-300 ${
        isDark ? 'bg-[#000000] text-zinc-100' : 'bg-white text-slate-900'
      }`}
    >
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Matches ChatGPT Reference Layout) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed md:relative inset-y-0 left-0 z-40 md:z-10 w-[260px] shrink-0 h-full flex flex-col border-r overflow-hidden ${
              isDark ? 'bg-[#0a0a0c] border-white/10' : 'bg-slate-50 border-slate-200'
            }`}
          >
            {/* Sidebar Top Header */}
            <div className="h-14 px-3.5 flex items-center justify-between shrink-0">
              <button
                onClick={handleStartNewChat}
                className="flex items-center gap-2 text-sm font-semibold tracking-tight cursor-pointer hover:opacity-80"
              >
                <span>CentralAI</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSidebarSearch((s) => !s)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    showSidebarSearch
                      ? isDark
                        ? 'bg-white/10 text-white'
                        : 'bg-slate-200 text-slate-900'
                      : isDark
                      ? 'text-zinc-400 hover:bg-white/10 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Search history"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'text-zinc-400 hover:bg-white/10 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-200'
                  }`}
                  title="Close sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Sidebar Search Input */}
            {showSidebarSearch && (
              <div className="px-3 pb-2 shrink-0">
                <input
                  type="text"
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  autoFocus
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#18181b] border-white/10 text-white placeholder-zinc-500 focus:border-white/25'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            )}

            {/* Sidebar Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {/* Primary Navigation */}
              <button
                onClick={handleStartNewChat}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'chat' && messages.length === 0
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <SquarePen className="w-4 h-4 shrink-0" />
                <span>New chat</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('image');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'image'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span>Images</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('research');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'research'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Deep Research</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('library');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'library'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Library className="w-4 h-4 shrink-0" />
                <span>Library</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('code');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'code'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0" />
                <span>Code & STEM</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('explore');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  activeView === 'explore'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200/80 text-slate-900'
                    : isDark
                    ? 'text-zinc-200 hover:bg-white/10'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Explore</span>
              </button>

              {/* Projects Section */}
              <div className="pt-5">
                <div className="px-3 mb-1.5 text-[11px] font-medium text-zinc-500">
                  Projects
                </div>
                {projectSessions.length === 0 ? (
                  <div className="px-3 py-1.5 text-xs text-zinc-500">
                    No projects
                  </div>
                ) : (
                  projectSessions.slice(0, 4).map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleLoadHistorySession(proj)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        isDark ? 'text-zinc-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-200/60'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{proj.title}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Recents Section */}
              <div className="pt-5">
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-500">Recents</span>
                  {historySessions.length > 0 && (
                    <button
                      onClick={() => setIsHistoryDrawerOpen(true)}
                      className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Manage
                    </button>
                  )}
                </div>

                {filteredRecents.length === 0 ? (
                  <div className="px-3 py-1.5 text-xs text-zinc-500">
                    {sidebarSearchQuery ? 'No matching chats' : 'No recent chats yet'}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredRecents.map((session) => {
                      const isActive = session.id === currentSessionId && messages.length > 0;
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleLoadHistorySession(session)}
                          className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer ${
                            isActive
                              ? isDark
                                ? 'bg-white/10 text-white'
                                : 'bg-slate-200 text-slate-900'
                              : isDark
                              ? 'text-zinc-300 hover:bg-white/10 hover:text-white'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <span className="truncate flex-1">{session.title}</span>
                          <button
                            onClick={(e) => handleDeleteHistorySession(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-opacity cursor-pointer"
                            title="Delete chat"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Bottom User Profile & Return Action */}
            <div className={`p-3 border-t shrink-0 space-y-2.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5 px-1">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/15"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#38bdf8] text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{user?.name || 'Central Student'}</p>
                  <p className="text-[11px] text-zinc-400 capitalize truncate">
                    {user?.role || 'Campus Member'}
                  </p>
                </div>
              </div>

              <button
                onClick={onBackToDashboard}
                id="back-to-dashboard-from-ai"
                className={`w-full py-2 px-3 rounded-full text-xs font-medium border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#18181b] hover:bg-[#27272a] border-white/10 text-zinc-200'
                    : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Central Mall</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 h-full flex flex-col relative">
        {/* Top Minimal Utility Header */}
        <header className="h-14 px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <>
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Open sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleStartNewChat}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="New chat"
                >
                  <SquarePen className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="flex items-center gap-2 px-2">
              <span className="text-sm font-semibold tracking-tight">CentralAI</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isDark ? 'bg-white/10 text-zinc-300' : 'bg-slate-100 text-slate-600'
              }`}>
                2.0
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              id="central-ai-history-btn"
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#18181b] hover:bg-[#27272a] border-white/10 text-zinc-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="Open History"
            >
              <History className="w-3.5 h-3.5 text-[#ff073a]" />
              <span>History</span>
              {historySessions.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#ff073a]/20 text-[#ff3366]">
                  {historySessions.length}
                </span>
              )}
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#18181b] hover:bg-[#27272a] border-white/10 text-zinc-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="Export conversation"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            <ThemeToggle />
          </div>
        </header>

        {/* Subtle Transient Toast Notice */}
        <AnimatePresence>
          {voiceNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-xs font-medium bg-[#18181b] text-white border border-white/15 shadow-xl"
            >
              {voiceNotice}
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW 1: CHAT VIEW (Empty Hero vs Active Stream) */}
        {activeView === 'chat' && (
          messages.length === 0 ? (
            /* Clean Centered Hero Matching Screenshot */
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-[32px] font-semibold tracking-tight mb-7 text-center"
              >
                Where should we begin?
              </motion.h1>

              {renderPillComposer(true)}

              {/* Minimal Quick Action Suggestions List */}
              <div className="w-full max-w-[680px] mt-5 pl-3 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setActiveView('image')}
                  className={`flex items-center gap-3 text-sm transition-colors cursor-pointer py-1 ${
                    isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  <span>Create an image or artwork</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('research')}
                  className={`flex items-center gap-3 text-sm transition-colors cursor-pointer py-1 ${
                    isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenLine className="w-4 h-4 text-zinc-400" />
                  <span>Write, research, or edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('Tell me about Central University Miotso admissions, faculties, and campus navigation')}
                  className={`flex items-center gap-3 text-sm transition-colors cursor-pointer py-1 ${
                    isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>Explore Central University & STEM</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Conversation Stream + Pinned Bottom Pill Bar */
            <>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff073a] to-[#8B0000] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}

                        <div className={`max-w-[85%] md:max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`text-sm md:text-[15px] leading-relaxed ${
                              isUser
                                ? isDark
                                  ? 'px-4 py-2.5 rounded-3xl bg-[#27272a] text-white'
                                  : 'px-4 py-2.5 rounded-3xl bg-slate-100 text-slate-900'
                                : isDark
                                ? 'text-zinc-100'
                                : 'text-slate-800'
                            }`}
                          >
                            <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                            {msg.imageUrl && (
                              <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-w-md">
                                <img
                                  src={msg.imageUrl}
                                  alt={msg.imagePrompt || 'CentralAI Generated'}
                                  className="w-full max-h-80 object-cover cursor-pointer hover:scale-[1.01] transition-transform"
                                  onClick={() => setZoomImage(msg.imageUrl || null)}
                                />
                                <div className="p-2.5 bg-[#18181b] flex items-center justify-between text-xs">
                                  <span className="text-[11px] text-zinc-400 truncate max-w-[180px]">
                                    {msg.imagePrompt}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setZoomImage(msg.imageUrl || null)}
                                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                    >
                                      Expand
                                    </button>
                                    <a
                                      href={msg.imageUrl}
                                      download={`CentralAI_${msg.id}.jpg`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-[#CE1126] hover:bg-[#ff073a] text-white font-semibold flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Save</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.quickActions && msg.quickActions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {msg.quickActions.map((qa, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(qa)}
                                    className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                                      isDark
                                        ? 'bg-[#18181b] hover:bg-white/10 border-white/10 text-zinc-300'
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {qa}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Assistant Action Icons */}
                          {!isUser && (
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                              <button
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {'speechSynthesis' in window && (
                                <button
                                  onClick={() => handleToggleSpeak(msg.id, msg.text)}
                                  className="hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  {speakingMsgId === msg.id ? (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5 text-[#ff073a]" />
                                      <span className="text-[#ff073a]">Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span>Listen</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {loading && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff073a] to-[#8B0000] text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff073a] animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff073a] animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff073a] animate-bounce [animation-delay:0.3s]" />
                        <span className="ml-1">CentralAI is thinking...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="shrink-0 px-4 pb-5 pt-2">
                {renderPillComposer(false)}
              </div>
            </>
          )
        )}

        {/* VIEW 2: IMAGES STUDIO */}
        {activeView === 'image' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#ff073a]" />
                  <span>CentralAI Image Studio</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Describe any visual scene and generate high-definition AI artwork.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#121215] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <textarea
                  rows={3}
                  placeholder="Describe the image you want CentralAI to create..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className={`w-full p-3.5 rounded-2xl text-sm border resize-none focus:outline-none ${
                    isDark
                      ? 'bg-[#18181b] border-white/10 text-white placeholder-zinc-500 focus:border-white/25'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] font-medium text-zinc-400 mb-2">Style</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'photorealistic', label: 'Photorealistic' },
                        { id: 'cinematic', label: 'Cinematic' },
                        { id: 'anime', label: 'Anime' },
                        { id: 'digital-art', label: 'Digital Art' },
                        { id: '3d-render', label: '3D Render' },
                        { id: 'cyberpunk', label: 'Cyberpunk' },
                        { id: 'oil-painting', label: 'Oil Painting' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setImageStyle(st.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                            imageStyle === st.id
                              ? 'bg-[#CE1126] border-[#CE1126] text-white'
                              : isDark
                              ? 'bg-[#18181b] border-white/10 text-zinc-300 hover:bg-white/10'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-zinc-400 mb-2">Aspect Ratio</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '1:1', label: '1:1 Square' },
                        { id: '16:9', label: '16:9 Landscape' },
                        { id: '9:16', label: '9:16 Portrait' },
                        { id: '4:3', label: '4:3 Standard' },
                      ].map((ar) => (
                        <button
                          key={ar.id}
                          onClick={() => setImageAspectRatio(ar.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                            imageAspectRatio === ar.id
                              ? 'bg-[#CE1126] border-[#CE1126] text-white'
                              : isDark
                              ? 'bg-[#18181b] border-white/10 text-zinc-300 hover:bg-white/10'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleGenerateImage(undefined, false)}
                    disabled={generatingImage || !imagePrompt.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#CE1126] hover:bg-[#ff073a] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {generatingImage ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Generate Image</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-medium text-zinc-400 mb-3">
                  Generated Gallery ({gallery.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className={`group rounded-2xl overflow-hidden border ${
                        isDark ? 'bg-[#121215] border-white/10' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div
                        className="relative aspect-video bg-black/50 overflow-hidden cursor-pointer"
                        onClick={() => setZoomImage(item.imageUrl)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomImage(item.imageUrl);
                            }}
                            className="p-2 rounded-full bg-white/20 text-white cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <a
                            href={item.imageUrl}
                            download={`CentralAI_${item.id}.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-full bg-[#CE1126] text-white cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500 uppercase">
                          <span>{item.style}</span>
                          <span>{item.aspectRatio}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DEEP RESEARCH ENGINE */}
        {activeView === 'research' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#ff073a]" />
                  <span>Deep Academic Research</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Run structured literature reviews, methodology outlines, and cited academic reports.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-[#121215] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <textarea
                  rows={3}
                  placeholder="Enter research topic (e.g., Impact of Mobile Money on informal SMEs in Greater Accra)..."
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  className={`w-full p-3.5 rounded-2xl text-sm border resize-none focus:outline-none ${
                    isDark
                      ? 'bg-[#18181b] border-white/10 text-white placeholder-zinc-500 focus:border-white/25'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'academic', label: 'Academic Paper' },
                      { id: 'economic', label: 'Economic & Market' },
                      { id: 'scientific', label: 'STEM & Scientific' },
                      { id: 'legal', label: 'Legal Jurisprudence' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setResearchFocus(f.id as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                          researchFocus === f.id
                            ? 'bg-[#CE1126] border-[#CE1126] text-white'
                            : isDark
                            ? 'bg-[#18181b] border-white/10 text-zinc-300 hover:bg-white/10'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleConductResearch()}
                    disabled={researching || !researchTopic.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#CE1126] hover:bg-[#ff073a] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    {researching ? 'Researching...' : 'Run Research'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: LIBRARY */}
        {activeView === 'library' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Media & Chat Library</h2>
                <button
                  onClick={() => setActiveView('image')}
                  className="px-4 py-1.5 rounded-full bg-[#CE1126] text-white text-xs font-semibold cursor-pointer"
                >
                  + New Image
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setZoomImage(item.imageUrl)}
                    className={`rounded-2xl overflow-hidden border cursor-pointer ${
                      isDark ? 'bg-[#121215] border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <img src={item.imageUrl} alt={item.prompt} className="w-full aspect-video object-cover" />
                    <div className="p-3">
                      <p className="text-xs line-clamp-2">{item.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CODE & STEM */}
        {activeView === 'code' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="max-w-3xl mx-auto space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#ff073a]" />
                  <span>Code & STEM Solver</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Pick a prompt template or type any programming/math problem below.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Write Python script for student marks grade allocation',
                  'Explain Dijkstra shortest path algorithm with code',
                  'Solve matrix multiplication and eigenvalues in Python',
                  'Write a React TypeScript component with Tailwind',
                  'Explain SQL database normalization (1NF, 2NF, 3NF)',
                  'Step-by-step integration by parts with examples',
                ].map((codePrompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(codePrompt)}
                    className={`p-4 rounded-2xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#121215] hover:bg-white/10 border-white/10 text-zinc-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{codePrompt}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: EXPLORE */}
        {activeView === 'explore' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
            <div className="max-w-4xl mx-auto space-y-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#ff073a]" />
                  <span>Explore CentralAI</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Specialized campus & academic capabilities built into CentralAI.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Admissions & Fees Guide',
                    desc: 'Ask about e-vouchers, cut-offs, and Central University faculties.',
                    prompt: 'How do admissions, e-vouchers, and faculties work at Central University Ghana?',
                  },
                  {
                    title: 'Campus Image Generator',
                    desc: 'Create photorealistic or artistic campus visuals.',
                    prompt: 'Generate an image of futuristic Central University Miotso campus at sunset',
                  },
                  {
                    title: 'Academic Paper Assistant',
                    desc: 'Draft research abstracts, citations, and outlines.',
                    prompt: 'Research Renewable Energy adoption in West African universities',
                  },
                  {
                    title: 'Software & STEM Tutor',
                    desc: 'Debug code, learn algorithms, and solve calculus.',
                    prompt: 'Write a clean Python GPA calculator function with documentation',
                  },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(card.prompt)}
                    className={`p-5 rounded-2xl border text-left transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#121215] hover:bg-white/10 border-white/10'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <h3 className="text-sm font-semibold mb-1">{card.title}</h3>
                    <p className="text-xs text-zinc-400">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER HISTORY DRAWER */}
      <AnimatePresence>
        {isHistoryDrawerOpen && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setIsHistoryDrawerOpen(false)}
          >
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full sm:w-96 h-full flex flex-col border-l shadow-2xl ${
                isDark ? 'bg-[#0a0a0c] border-white/10 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div
                className={`px-5 py-4 border-b flex items-center justify-between ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-[#ff073a]" />
                  <div>
                    <h2 className="text-sm font-semibold">Chat History</h2>
                    <p className="text-[11px] text-zinc-400">
                      {historySessions.length} saved conversation{historySessions.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-white/10">
                <button
                  onClick={handleStartNewChat}
                  className="w-full py-2.5 px-4 rounded-full bg-[#CE1126] hover:bg-[#ff073a] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New chat</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {historySessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 text-zinc-500">
                    <History className="w-9 h-9 mb-2 opacity-40" />
                    <p className="text-xs">No saved conversations yet.</p>
                  </div>
                ) : (
                  historySessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleLoadHistorySession(session)}
                        className={`group p-3 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                          isActive
                            ? isDark
                              ? 'bg-white/10 border-white/20'
                              : 'bg-slate-100 border-slate-300'
                            : isDark
                            ? 'bg-transparent hover:bg-white/5 border-transparent'
                            : 'bg-transparent hover:bg-slate-50 border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{session.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {session.updatedAt} • {session.messages.length} msgs
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteHistorySession(session.id, e)}
                          className="p-1 rounded opacity-60 group-hover:opacity-100 hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {historySessions.length > 0 && (
                <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  <button
                    onClick={handleClearAllHistory}
                    className="w-full py-2 px-3 rounded-full text-xs font-medium border border-red-900/50 text-red-400 hover:bg-red-950/40 cursor-pointer transition-colors"
                  >
                    Clear All History
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={zoomImage}
                alt="Enlarged CentralAI Artwork"
                className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/15"
              />
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={zoomImage}
                  download="CentralAI_Generated_Image.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 rounded-full bg-[#CE1126] hover:bg-[#ff073a] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </a>
                <button
                  onClick={() => setZoomImage(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CentralAIView;
