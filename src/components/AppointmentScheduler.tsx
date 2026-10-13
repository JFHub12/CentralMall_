import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, Video, PhoneCall, Building2, User, Stethoscope, 
  CheckCircle2, ShieldCheck, AlertCircle, ExternalLink, Copy, Check, 
  Sparkles, X, ChevronRight, RefreshCw, Eye, Mic, MessageSquare, Plus,
  FileText, HeartPulse, UserCheck, CalendarDays, ArrowRight
} from 'lucide-react';
import { ClinicAppointment, ConsultationType } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AppointmentSchedulerProps {
  user: any;
  onAppointmentBooked?: (appointment: ClinicAppointment) => void;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
}

interface DoctorProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  availableDays: string;
  rating: string;
  ghsId: string;
}

const DOCTOR_SPECIALISTS: DoctorProfile[] = [
  {
    id: 'doc-1',
    name: 'Dr. Emmanuel Mensah, MD',
    role: 'Campus Medical Officer & Physician',
    department: 'General Outpatient & Tropical Medicine',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250',
    availableDays: 'Mon - Fri',
    rating: '4.9 (140+ consultations)',
    ghsId: 'GHS-MDC-88410'
  },
  {
    id: 'doc-2',
    name: 'Senior Nursing Officer Rita Appiah',
    role: 'Triage & Student Health Lead',
    department: 'Acute Care & Preventive Health',
    avatar: 'https://images.unsplash.com/photo-1594824813589-7756f4d54ec9?auto=format&fit=crop&q=80&w=250',
    availableDays: 'Daily 24/7',
    rating: '5.0 (210+ consultations)',
    ghsId: 'GHS-NMC-55912'
  },
  {
    id: 'doc-3',
    name: 'Dr. Abena Owusu-Ansah, PharmD',
    role: 'Clinical Pharmacist & Specialist',
    department: 'School of Pharmacy & Drug Safety',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
    availableDays: 'Mon - Thu',
    rating: '4.8 (95 consultations)',
    ghsId: 'GPC-PH-33108'
  },
  {
    id: 'doc-4',
    name: 'Mrs. Grace Addo, MPhil',
    role: 'Campus Counseling & Mental Health Lead',
    department: 'Student Affairs & Psychological Wellness',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    availableDays: 'Tue, Wed, Fri',
    rating: '4.9 (180+ sessions)',
    ghsId: 'GCP-PSY-12044'
  }
];

const TIME_SLOTS = [
  { time: '09:00 AM', slot: '09:00 AM - 09:30 AM', period: 'morning', booked: false },
  { time: '09:45 AM', slot: '09:45 AM - 10:15 AM', period: 'morning', booked: true },
  { time: '10:30 AM', slot: '10:30 AM - 11:00 AM', period: 'morning', booked: false },
  { time: '11:15 AM', slot: '11:15 AM - 11:45 AM', period: 'morning', booked: false },
  { time: '01:30 PM', slot: '01:30 PM - 02:00 PM', period: 'afternoon', booked: false },
  { time: '02:15 PM', slot: '02:15 PM - 02:45 PM', period: 'afternoon', booked: true },
  { time: '03:00 PM', slot: '03:00 PM - 03:30 PM', period: 'afternoon', booked: false },
  { time: '03:45 PM', slot: '03:45 PM - 04:15 PM', period: 'afternoon', booked: false },
  { time: '05:00 PM', slot: '05:00 PM - 05:30 PM', period: 'evening', booked: false },
  { time: '05:45 PM', slot: '05:45 PM - 06:15 PM', period: 'evening', booked: false },
];

const COMMON_SYMPTOMS = [
  'Malaria Screening & Fever',
  'Cold, Cough & Flu Symptoms',
  'Headache & Eye Strain',
  'Stomach Pain & Dehydration',
  'Exam Stress & Mental Wellness',
  'Prescription Refill',
  'Skin Rash / Allergy',
  'Routine Health Checkup'
];

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  user,
  onAppointmentBooked,
  isOpenAsModal = false,
  onCloseModal
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'schedule' | 'my-appointments'>('schedule');

  // Form state
  const [consultationType, setConsultationType] = useState<ConsultationType>('virtual_video');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile>(DOCTOR_SPECIALISTS[0]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:30 AM - 11:00 AM');
  const [selectedTime, setSelectedTime] = useState<string>('10:30 AM');
  const [studentName, setStudentName] = useState<string>(user?.name || 'Jesse Fiagbe');
  const [studentId, setStudentId] = useState<string>(user?.studentId || 'CU-2026-9021');
  const [reason, setReason] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Malaria Screening & Fever']);
  const [nhisNumber, setNhisNumber] = useState<string>('NHIS-GH-9021884');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // UI state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<ClinicAppointment | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [appointmentsList, setAppointmentsList] = useState<ClinicAppointment[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [activeVirtualRoom, setActiveVirtualRoom] = useState<ClinicAppointment | null>(null);

  // Generate available dates (next 7 days starting today)
  const [availableDates, setAvailableDates] = useState<{ label: string; dateStr: string; dayName: string; isToday: boolean }[]>([]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dates.push({ label, dateStr, dayName, isToday: i === 0 });
    }
    setAvailableDates(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, []);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/clinic/appointments?studentId=${studentId}`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from appointments API');
      }
      const data = await res.json();
      if (data && Array.isArray(data.appointments)) {
        setAppointmentsList(data.appointments);
      }
    } catch (err) {
      console.warn('Appointments API notice:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [studentId]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleSlotSelect = (slot: typeof TIME_SLOTS[0]) => {
    if (slot.booked) return;
    setSelectedTime(slot.time);
    setSelectedTimeSlot(slot.slot);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || (!reason && selectedSymptoms.length === 0)) return;

    setSubmitting(true);

    const primaryReason = reason.trim() || selectedSymptoms.join(', ');

    const payload = {
      studentName: studentName.trim() || user?.name || 'Student',
      studentId: studentId.trim() || 'CU-2026-9021',
      doctorName: selectedDoctor.name,
      specialistRole: selectedDoctor.role,
      consultationType: consultationType,
      date: selectedDate,
      time: selectedTime,
      timeSlot: selectedTimeSlot,
      reason: primaryReason,
      symptoms: selectedSymptoms,
      nhisNumber: nhisNumber.trim(),
      notes: additionalNotes.trim() || 'Virtual consultation room active. GHS encrypted audio/video channel.'
    };

    try {
      const res = await fetch('/api/clinic/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from appointments API');
      }
      const data = await res.json();
      if (data && data.appointment) {
        setConfirmedAppointment(data.appointment);
        setAppointmentsList(prev => [data.appointment, ...prev]);
        
        if (onAppointmentBooked) {
          onAppointmentBooked(data.appointment);
        }
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      const res = await fetch('/api/clinic/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from cancel appointment API');
      }
      const data = await res.json();
      if (data && data.appointment) {
        setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a));
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`w-full rounded-3xl transition-all text-left ${
      isOpenAsModal ? 'p-0' : 'p-6 md:p-8 bg-white border border-red-100 shadow-xl shadow-red-100/40'
    } ${isDark && !isOpenAsModal ? 'bg-slate-900 border-slate-800 shadow-black/40 text-slate-100' : ''}`}>
      
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#CE1126] to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#CE1126] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Slot Booking
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                Ghana Health Service (GHS)
              </span>
            </div>
            <h2 className={`text-xl md:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Virtual Consultation & Appointment Scheduler
            </h2>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => {
                setActiveTab('schedule');
                setConfirmedAppointment(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-[#CE1126] text-white shadow-md'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>

            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my-appointments'
                  ? 'bg-[#CE1126] text-white shadow-md'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>My Appointments</span>
              {appointmentsList.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  activeTab === 'my-appointments' ? 'bg-white text-[#CE1126]' : 'bg-[#CE1126] text-white'
                }`}>
                  {appointmentsList.length}
                </span>
              )}
            </button>
          </div>

          {isOpenAsModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className={`p-2 rounded-full cursor-pointer transition-colors ${
                isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* BODY CONTENT */}
      {activeTab === 'schedule' && (
        <div className="pt-6">
          {confirmedAppointment ? (
            /* BOOKING SUCCESS SCREEN */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 md:p-8 rounded-3xl border text-center space-y-6 ${
                isDark ? 'bg-slate-800/80 border-emerald-900/50' : 'bg-emerald-50/60 border-emerald-200'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Appointment Confirmed & Synced
                </span>
                <h3 className={`text-2xl font-black mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Virtual Consultation Scheduled Successfully!
                </h3>
                <p className={`text-xs mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Reference ID: <strong>{confirmedAppointment.id}</strong>
                </p>
              </div>

              {/* Consultation Details Card */}
              <div className={`max-w-xl mx-auto p-5 rounded-2xl border text-left space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-[#CE1126] flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">Doctor / Specialist</p>
                      <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {confirmedAppointment.doctorName}
                      </p>
                      <p className="text-[11px] text-slate-500">{confirmedAppointment.specialistRole}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {confirmedAppointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date & Time Slot</span>
                    <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Calendar className="w-3.5 h-3.5 text-[#CE1126]" />
                      {confirmedAppointment.date} ({confirmedAppointment.timeSlot || confirmedAppointment.time})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Consultation Mode</span>
                    <span className={`font-bold flex items-center gap-1 capitalize ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Video className="w-3.5 h-3.5 text-emerald-500" />
                      {confirmedAppointment.consultationType?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Reason for Visit</span>
                  <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {confirmedAppointment.reason}
                  </p>
                </div>

                {/* Virtual Room Link Box */}
                {confirmedAppointment.virtualLink && (
                  <div className={`p-3.5 rounded-xl border mt-3 flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-red-50/70 border-red-200/70'
                  }`}>
                    <div className="truncate">
                      <span className="text-[10px] font-black uppercase text-[#CE1126] block">
                        Encrypted GHS Virtual Telehealth Room
                      </span>
                      <span className="text-xs font-mono font-bold truncate block text-slate-700 dark:text-slate-300">
                        {confirmedAppointment.virtualLink}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyLink(confirmedAppointment.virtualLink || '')}
                        className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-700 border-slate-600 text-slate-200 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="Copy Room Link"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setActiveVirtualRoom(confirmedAppointment)}
                        className="px-3 py-2 rounded-lg text-xs font-black bg-[#CE1126] hover:bg-[#A00D1D] text-white flex items-center gap-1 shadow-md shadow-red-500/20 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Room</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setConfirmedAppointment(null);
                    setReason('');
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  Schedule Another Appointment
                </button>

                <button
                  onClick={() => setActiveTab('my-appointments')}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#CE1126] hover:bg-[#A00D1D] text-white flex items-center gap-1.5 shadow-md shadow-red-500/20 cursor-pointer"
                >
                  <span>View in My Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* SCHEDULER FORM */
            <form onSubmit={handleFormSubmit} className="space-y-6">
              
              {/* 1. CONSULTATION TYPE SELECTION */}
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  1. Select Consultation Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    onClick={() => setConsultationType('virtual_video')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      consultationType === 'virtual_video'
                        ? 'border-[#CE1126] bg-red-50/50 dark:bg-red-950/30 text-[#CE1126] shadow-sm'
                        : isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      consultationType === 'virtual_video' ? 'bg-[#CE1126] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black leading-tight">Virtual Video Consult</h4>
                      <p className="text-[10px] opacity-75 mt-0.5">Encrypted HD video room with doctor</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setConsultationType('virtual_voice')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      consultationType === 'virtual_voice'
                        ? 'border-[#CE1126] bg-red-50/50 dark:bg-red-950/30 text-[#CE1126] shadow-sm'
                        : isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      consultationType === 'virtual_voice' ? 'bg-[#CE1126] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black leading-tight">Virtual Voice Triage</h4>
                      <p className="text-[10px] opacity-75 mt-0.5">Direct phone / audio consultation</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setConsultationType('in_person')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      consultationType === 'in_person'
                        ? 'border-[#CE1126] bg-red-50/50 dark:bg-red-950/30 text-[#CE1126] shadow-sm'
                        : isDark ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      consultationType === 'in_person' ? 'bg-[#CE1126] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black leading-tight">In-Person Clinic Visit</h4>
                      <p className="text-[10px] opacity-75 mt-0.5">Miotso Trinity Ward (CLN-01)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SELECT DOCTOR / SPECIALIST */}
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  2. Choose Medical Officer or Specialist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {DOCTOR_SPECIALISTS.map((doc) => {
                    const isSelected = selectedDoctor.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#CE1126] bg-red-50/40 dark:bg-red-950/20 shadow-md'
                            : isDark ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={doc.avatar}
                            alt={doc.name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h4 className={`text-xs font-black truncate leading-tight ${
                              isSelected ? 'text-[#CE1126]' : isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {doc.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{doc.role}</p>
                            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                              {doc.ghsId}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{doc.availableDays}</span>
                          <span className="font-bold text-amber-500">★ {doc.rating.split(' ')[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. DATE SELECTION */}
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  3. Select Date
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {availableDates.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all shrink-0 cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-md shadow-red-500/20'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-[10px] uppercase opacity-80">{item.dayName}</span>
                        <span className="block text-sm font-black">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. INTERACTIVE TIME SLOT PICKER */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className={`block text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    4. Pick Available 30-Minute Time Slot
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Selected: <strong className="text-[#CE1126]">{selectedTimeSlot}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {TIME_SLOTS.map((slot, index) => {
                    const isSelected = selectedTimeSlot === slot.slot;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={slot.booked}
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-3 rounded-xl text-xs font-extrabold border transition-all text-center cursor-pointer relative ${
                          slot.booked
                            ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-md shadow-red-500/30'
                              : isDark
                                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-[#CE1126]'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-red-300 hover:bg-red-50/50'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 mx-auto mb-1 ${
                          isSelected ? 'text-white' : slot.booked ? 'text-slate-400' : 'text-[#CE1126]'
                        }`} />
                        <span>{slot.time}</span>
                        {slot.booked ? (
                          <span className="block text-[8px] font-black uppercase text-red-500 mt-0.5">Booked</span>
                        ) : (
                          <span className="block text-[9px] opacity-75 font-normal">Available</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. SYMPTOM CHIPS & REASON */}
              <div>
                <label className={`block text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  5. Symptoms & Health Concerns (Quick-Select)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_SYMPTOMS.map((symptom) => {
                    const isChecked = selectedSymptoms.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-sm'
                            : isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 inline mr-1" />}
                        {symptom}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  placeholder="Additional details or specific symptoms you'd like the doctor to review..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full p-3 rounded-2xl text-xs font-medium border focus:outline-none focus:border-[#CE1126] ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* 6. PATIENT INDEX & NHIS DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-[#CE1126] font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Student Index Number
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-[#CE1126] font-mono font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>Ghana NHIS Number</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold">100% Free</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NHIS-GH-9021884"
                    value={nhisNumber}
                    onChange={(e) => setNhisNumber(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-[#CE1126] font-mono font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  id="confirm-virtual-appointment-button"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#CE1126] to-red-600 hover:from-[#A00D1D] hover:to-red-700 text-white font-black text-sm shadow-xl shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Securing Time Slot & Generating Telehealth Room...</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>Confirm {consultationType === 'in_person' ? 'Clinic Appointment' : 'Virtual Consultation Slot'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MY SCHEDULED APPOINTMENTS VIEW */}
      {activeTab === 'my-appointments' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Active & Upcoming Consultations ({appointmentsList.length})
            </h3>
            <button
              onClick={fetchAppointments}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingList ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#CE1126]" />
              Loading your appointments...
            </div>
          ) : appointmentsList.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${
              isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold">No consultations scheduled yet</p>
              <p className="text-xs mt-1 mb-4">You have not booked any virtual or in-person sessions.</p>
              <button
                onClick={() => setActiveTab('schedule')}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#CE1126] text-white cursor-pointer shadow-md shadow-red-500/20"
              >
                Book Your First Consultation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentsList.map((appt) => {
                const isCancelled = appt.status === 'Cancelled';
                return (
                  <div
                    key={appt.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCancelled
                        ? isDark ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'
                        : isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-white border-slate-200 shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCancelled
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {appt.status}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">{appt.id}</span>
                      </div>

                      <h4 className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {appt.reason}
                      </h4>

                      <p className="text-xs font-bold text-[#CE1126] mb-2">
                        {appt.doctorName || 'Central Clinic Physician'}
                      </p>

                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#CE1126]" />
                          <span>{appt.date} • {appt.timeSlot || appt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                          <Video className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{appt.consultationType?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {appt.virtualLink && !isCancelled && (
                        <button
                          onClick={() => setActiveVirtualRoom(appt)}
                          className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#CE1126] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Enter Telehealth Room</span>
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer ml-auto"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIRTUAL CONSULTATION ROOM SIMULATOR MODAL */}
      <AnimatePresence>
        {activeVirtualRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 text-white p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Live Telehealth Session Active
                  </span>
                </div>
                <button
                  onClick={() => setActiveVirtualRoom(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Area Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Doctor Feed */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 aspect-video relative overflow-hidden flex flex-col justify-between p-4">
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                    alt="Doctor Feed"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="relative z-10 flex justify-between">
                    <span className="text-[10px] font-bold bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                      GHS Verified Video
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">1080p Encrypted</span>
                  </div>
                  <div className="relative z-10 bg-slate-900/80 p-2 rounded-xl backdrop-blur-md border border-slate-700">
                    <p className="text-xs font-black">{activeVirtualRoom.doctorName}</p>
                    <p className="text-[10px] text-slate-300">Central University Clinic Desk</p>
                  </div>
                </div>

                {/* Patient Feed */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 aspect-video relative overflow-hidden flex flex-col justify-between p-4">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
                    alt="Patient Feed"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <div className="relative z-10 flex justify-between">
                    <span className="text-[10px] font-bold bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
                      {activeVirtualRoom.studentName} (You)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">Mic On</span>
                  </div>
                  <div className="relative z-10 bg-slate-900/80 p-2 rounded-xl backdrop-blur-md border border-slate-700">
                    <p className="text-xs font-black">{activeVirtualRoom.studentId}</p>
                    <p className="text-[10px] text-slate-300">NHIS Active</p>
                  </div>
                </div>
              </div>

              {/* Consultation Controls */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-slate-200">Consultation Focus:</p>
                  <p className="text-slate-400">{activeVirtualRoom.reason}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeVirtualRoom.virtualLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Open in Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveVirtualRoom(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    End Call
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
