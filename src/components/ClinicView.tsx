import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Stethoscope, ArrowLeft, Send, PhoneCall, Calendar, Clock, AlertTriangle, 
  ShieldAlert, Sparkles, User, CheckCircle2, X, HeartPulse, Globe, ShieldCheck, Activity,
  Video, MessageSquare, Plus, ExternalLink, ChevronRight, CalendarDays
} from 'lucide-react';
import { ChatMessage, ClinicAppointment } from '../types';
import { AppointmentScheduler } from './AppointmentScheduler';
import { GHSHealthTipsCarousel } from './GHSHealthTipsCarousel';
import { useTheme } from '../context/ThemeContext';

interface ClinicViewProps {
  user: any;
  onBackToDashboard: () => void;
}

export const ClinicView: React.FC<ClinicViewProps> = ({ user, onBackToDashboard }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation tab in Clinic: chat vs scheduler
  const [activeClinicTab, setActiveClinicTab] = useState<'chat' | 'scheduler'>('chat');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'clinic_nurse',
      text: `Hello ${user?.name || 'Student'}! Welcome to Central University School Clinic Virtual Triage & Consultation Desk at Miotso Main Campus.\n\nWe operate strictly under Ghana Health Service (GHS - https://ghs.gov.gh/) clinical guidelines and accept valid NHIS cards. You can chat with our on-duty triage team or schedule a 1-on-1 virtual consultation with our campus physicians!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        'Book Virtual Video Consultation',
        'Ghana Health Service Malaria Protocol',
        'Acute Dehydration & ORS Guidelines',
        'NHIS Insurance Card Coverage',
        'Emergency Ambulance Dispatch'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Appointment Modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/clinic/appointments?studentId=${user?.studentId || 'CU-2026-9021'}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from appointments API');
      }
      const data = await res.json();
      if (data && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.warn('Clinic appointments API notice:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const handleUpdate = () => {
      fetchAppointments();
    };
    window.addEventListener('central_mall_content_updated', handleUpdate);
    return () => window.removeEventListener('central_mall_content_updated', handleUpdate);
  }, [user]);

  // Handle Send Message to Clinic Nurse AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    if (text.toLowerCase().includes('book') || text.toLowerCase().includes('schedule') || text.toLowerCase().includes('appointment')) {
      setActiveClinicTab('scheduler');
    }

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/clinic/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from clinic chat API');
      }
      const data = await res.json();
      const replyMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'clinic_nurse',
        text: data.reply || 'Central Clinic Miotso nurse desk is standing by. Visit the clinic near Trinity Hall or book a virtual consultation slot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, replyMsg]);
    } catch (err) {
      console.error('Error in Clinic Chat', err);
    } finally {
      setSending(false);
    }
  };

  const handleAppointmentBooked = (newAppt: ClinicAppointment) => {
    setAppointments((prev) => [newAppt, ...prev]);
    setShowAppointmentModal(false);
  };

  return (
    <div className={`relative min-h-screen z-10 flex flex-col px-4 py-6 max-w-6xl mx-auto ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 mb-6 p-4 md:p-5 rounded-3xl backdrop-blur-md shadow-lg border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/40' : 'bg-white/95 border-red-200/80 shadow-red-100/50'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            id="back-to-dashboard-from-clinic"
            className={`p-2.5 rounded-full transition-colors cursor-pointer border ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-slate-100 hover:bg-red-50 border-slate-200 hover:border-red-200 text-slate-600 hover:text-[#CE1126]'
            }`}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#CE1126] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Clinic & Telehealth
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                Trinity Ward (CLN-01)
              </span>
            </div>
            <h1 className={`text-xl md:text-2xl font-black flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Stethoscope className="w-6 h-6 text-[#CE1126]" />
              Central School Clinic Desk
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
              <span>Miotso Main Campus</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-[#CE1126] font-bold">
                <Globe className="w-3 h-3" />
                <a href="https://ghs.gov.gh/" target="_blank" rel="noreferrer" className="hover:underline">
                  Ghana Health Service (ghs.gov.gh) Accredited
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Emergency Hotline Button */}
          <a
            href="tel:+233303930000"
            id="clinic-emergency-call-button"
            className="flex items-center gap-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs px-4 py-2.5 rounded-full shadow-md shadow-red-500/20 cursor-pointer transition-all animate-pulse"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Emergency (+233 30 393 0000)</span>
          </a>

          {/* Book Appointment Modal Trigger */}
          <button
            onClick={() => setActiveClinicTab('scheduler')}
            id="open-appointment-modal-button"
            className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-full transition-all cursor-pointer border ${
              activeClinicTab === 'scheduler'
                ? 'bg-[#CE1126] text-white border-[#CE1126] shadow-md shadow-red-500/20'
                : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-[#CE1126]'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Appointment Scheduler</span>
          </button>
        </div>
      </div>

      {/* Ghana Health Service (GHS) Rotating Daily Health Tips Section */}
      <GHSHealthTipsCarousel
        onSelectAction={(tipTitle) => {
          setActiveClinicTab('chat');
          handleSendMessage(`I would like to know more about the GHS advice on "${tipTitle}". How does this apply to students on campus?`);
        }}
      />

      {/* Main View Tab Selector */}
      <div className={`flex items-center justify-between p-1.5 rounded-2xl border mb-6 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100 shadow-sm'
      }`}>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveClinicTab('chat')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeClinicTab === 'chat'
                ? 'bg-[#CE1126] text-white shadow-md shadow-red-500/20'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>24/7 GHS Nurse Triage Chat</span>
          </button>

          <button
            onClick={() => setActiveClinicTab('scheduler')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeClinicTab === 'scheduler'
                ? 'bg-[#CE1126] text-white shadow-md shadow-red-500/20'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Virtual Consultation & Slot Scheduler</span>
            {appointments.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeClinicTab === 'scheduler' ? 'bg-white text-[#CE1126]' : 'bg-[#CE1126] text-white'
              }`}>
                {appointments.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-slate-400 pr-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>NHIS Verified Telehealth</span>
        </div>
      </div>

      {/* VIEW CONDITIONAL RENDERING */}
      {activeClinicTab === 'scheduler' ? (
        /* APPOINTMENT SCHEDULER VIEW */
        <AppointmentScheduler
          user={user}
          onAppointmentBooked={handleAppointmentBooked}
        />
      ) : (
        /* CHAT AND CLINIC OVERVIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* CHAT MESSAGES WINDOW */}
          <div className={`lg:col-span-2 rounded-3xl p-4 md:p-6 shadow-xl flex flex-col min-h-[520px] border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-red-100 shadow-red-100/50'
          }`}>
            {/* Chat Info Bar */}
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Duty Medical Officer & Nurse Triage Active
                </span>
              </div>
              <button
                onClick={() => setActiveClinicTab('scheduler')}
                className="text-[10px] text-[#CE1126] font-bold bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/60 flex items-center gap-1 cursor-pointer hover:bg-[#CE1126] hover:text-white transition-all"
              >
                <Calendar className="w-3 h-3" />
                <span>Book Slot</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 text-left">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#CE1126] text-white rounded-br-none shadow-md shadow-red-500/20'
                        : isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] opacity-60 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Quick Action Chips */}
                  {msg.quickActions && (
                    <div className="flex flex-wrap gap-2 mt-3 max-w-[90%]">
                      {msg.quickActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (action.toLowerCase().includes('book') || action.toLowerCase().includes('consultation')) {
                              setActiveClinicTab('scheduler');
                            } else {
                              handleSendMessage(action);
                            }
                          }}
                          className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer shadow-sm ${
                            isDark
                              ? 'bg-slate-800 hover:bg-[#CE1126] border-slate-700 text-slate-200 hover:text-white'
                              : 'bg-red-50 hover:bg-[#CE1126] text-[#CE1126] hover:text-white border-red-200'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2 text-xs text-[#CE1126] italic font-semibold">
                  <HeartPulse className="w-4 h-4 animate-spin text-[#CE1126]" />
                  <span>Central Clinic Nurse checking GHS medical protocols...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="Ask any health question, fever symptoms, or Ghana Health Service advice..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className={`w-full pl-4 pr-12 py-3 rounded-2xl text-xs md:text-sm placeholder-slate-400 focus:outline-none focus:border-[#CE1126] border transition-colors ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white focus:bg-slate-800/90'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              />
              <button
                type="submit"
                disabled={sending || !inputMessage.trim()}
                id="send-clinic-message-button"
                className="absolute right-2 p-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white rounded-xl cursor-pointer disabled:opacity-40 transition-colors shadow-md shadow-red-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* SIDEBAR: CLINIC INFO & SCHEDULED APPOINTMENTS */}
          <div className="space-y-6 text-left">
            {/* Quick Virtual Consultation Promo Card */}
            <div className={`rounded-3xl p-5 border shadow-xl transition-all space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-gradient-to-br from-red-50/70 to-white border-red-200 shadow-red-100/40'
            }`}>
              <div className="flex items-center gap-2 text-[#CE1126]">
                <Video className="w-5 h-5" />
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Telehealth Virtual Rooms
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect directly with campus doctors, pharmacist specialists, and counseling officers via video or voice.
              </p>
              <button
                onClick={() => setActiveClinicTab('scheduler')}
                className="w-full py-2.5 rounded-xl text-xs font-black bg-[#CE1126] hover:bg-[#A00D1D] text-white flex items-center justify-center gap-2 shadow-md shadow-red-500/20 cursor-pointer transition-all"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Open Appointment Scheduler</span>
              </button>
            </div>

            {/* Quick Info Box */}
            <div className={`rounded-3xl p-5 border shadow-xl space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-red-100 shadow-red-100/50'
            }`}>
              <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ShieldCheck className="w-4 h-4 text-[#CE1126]" />
                GHS Standards & Services
              </h3>

              <div className={`text-xs space-y-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <p>• <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Location:</strong> Miotso Main Campus, adjacent to Trinity Hall (CLN-01).</p>
                <p>• <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Services:</strong> 24/7 Outpatient Consultations, RDT Malaria testing, Pharmacy, Emergency Ambulance Dispatch.</p>
                <p>• <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>NHIS Covered:</strong> Consultations, laboratory basic screens, and essential ACT pharmaceuticals.</p>
                <p>• <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>Emergency Hotline:</strong> +233 (0)30 393 0000 / 112</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>In case of severe difficulty breathing or sudden trauma, the on-duty ambulance will deploy immediately.</span>
              </div>
            </div>

            {/* My Appointments Quick List */}
            <div className={`rounded-3xl p-5 border shadow-xl space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-red-100 shadow-red-100/50'
            }`}>
              <h3 className={`text-sm font-black flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>My Clinic Appointments</span>
                <span className="text-xs bg-[#CE1126] text-white font-bold px-2 py-0.5 rounded-full font-mono">
                  {appointments.length}
                </span>
              </h3>

              {appointments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-2">No upcoming consultations scheduled.</p>
                  <button
                    onClick={() => setActiveClinicTab('scheduler')}
                    className="text-xs font-bold text-[#CE1126] hover:underline cursor-pointer"
                  >
                    + Pick a Time Slot
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => setActiveClinicTab('scheduler')}
                      className={`p-3 rounded-2xl text-xs space-y-1 cursor-pointer transition-all border ${
                        isDark ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-red-200'
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span className={`truncate mr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{appt.reason}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase shrink-0">{appt.status}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-3 text-[11px]">
                        <span><Calendar className="w-3 h-3 inline mr-1 text-[#CE1126]" />{appt.date}</span>
                        <span><Clock className="w-3 h-3 inline mr-1 text-[#CE1126]" />{appt.timeSlot || appt.time}</span>
                      </div>
                    </div>
                  ))}

                  {appointments.length > 3 && (
                    <button
                      onClick={() => setActiveClinicTab('scheduler')}
                      className="text-[11px] font-bold text-[#CE1126] w-full text-center hover:underline pt-1 cursor-pointer"
                    >
                      View all ({appointments.length}) appointments →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

