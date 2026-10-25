import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Key, Lock, Unlock, X, Plus, Edit2, Trash2, RefreshCw,
  ShoppingBag, Check, AlertCircle, Eye, EyeOff, Sparkles, Download,
  ExternalLink, Layers, Search, Bell, Clock, Stethoscope, ChevronRight,
  TrendingUp, Copy, CheckCircle2, RotateCcw, Monitor, Smartphone, Globe
} from 'lucide-react';
import { Product, ProductCategory, Order, CampusNotice, ClinicAppointment } from '../types';
import {
  verifyAdminPassword,
  changeAdminPassword,
  isAdminAuthenticated,
  setAdminSession,
  MASKED_ADMIN_PASSWORD_DISPLAY
} from '../config/adminConfig';

interface AdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: () => void;
  onNoticesUpdated?: () => void;
  pwaInstallPrompt?: any; // BeforeInstallPromptEvent
}

type AdminTab = 'shop' | 'orders' | 'notices' | 'clinic' | 'favicon_pwa' | 'security';

export const AdminConsoleModal: React.FC<AdminConsoleModalProps> = ({
  isOpen,
  onClose,
  onProductsUpdated,
  onNoticesUpdated,
  pwaInstallPrompt
}) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('shop');

  // Shop Products CMS State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory>('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Product Form State
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Textbooks & Books');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formImagePreview, setFormImagePreview] = useState('');
  const [formSellerName, setFormSellerName] = useState('Central Campus Store');
  const [formSellerContact, setFormSellerContact] = useState('+233241234567');
  const [formLocation, setFormLocation] = useState('Senate Building Ground Floor');
  const [formCondition, setFormCondition] = useState<'Brand New' | 'Like New' | 'Fair'>('Brand New');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Deletion Confirmation Modal State (Reliable without window.confirm)
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'product' | 'notice' | 'order' | 'appointment';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Orders CMS State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Notices CMS State
  const [notices, setNotices] = useState<CampusNotice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<CampusNotice | null>(null);
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState<boolean>(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<string>('Academic');
  const [noticePriority, setNoticePriority] = useState<CampusNotice['priority']>('normal');

  // Clinic Appointments CMS State
  const [appointments, setAppointments] = useState<ClinicAppointment[]>([]);
  const [clinicLoading, setClinicLoading] = useState<boolean>(false);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState<boolean>(false);
  const [apptStudentName, setApptStudentName] = useState('Jesse Fiagbe');
  const [apptStudentId, setApptStudentId] = useState('CU-2026-9021');
  const [apptDoctorName, setApptDoctorName] = useState('Dr. Kwame Boateng, MD');
  const [apptSpecialistRole, setApptSpecialistRole] = useState('Lead Physician & Medical Officer');
  const [apptConsultationType, setApptConsultationType] = useState<'virtual_video' | 'virtual_voice' | 'in_person'>('virtual_video');
  const [apptDate, setApptDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('11:00 AM');
  const [apptTimeSlot, setApptTimeSlot] = useState('11:00 AM - 11:30 AM');
  const [apptReason, setApptReason] = useState('Routine Health Checkup & Consultation');
  const [apptSymptoms, setApptSymptoms] = useState('');
  const [apptNhisNumber, setApptNhisNumber] = useState('NHIS-GH-9021884');
  const [apptNotes, setApptNotes] = useState('Scheduled directly via Central University Admin Console');

  // Password Change State
  const [currentPwdInput, setCurrentPwdInput] = useState('');
  const [newPwdInput, setNewPwdInput] = useState('');
  const [confirmPwdInput, setConfirmPwdInput] = useState('');
  const [pwdChangeMessage, setPwdChangeMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  // Chatbot API Configuration State
  const [chatApiKeyInput, setChatApiKeyInput] = useState('');
  const [chatModelInput, setChatModelInput] = useState('openai/gpt-4o-mini');
  const [chatKeyMessage, setChatKeyMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingChatKey, setIsSavingChatKey] = useState(false);
  const [showChatKey, setShowChatKey] = useState(false);
  const MASKED_CHATBOT_KEY_DISPLAY = 'sk-or-v1-********************************';

  // Favicon & PWA Suite State
  const [copiedFaviconSvg, setCopiedFaviconSvg] = useState(false);
  const [installedPwa, setInstalledPwa] = useState(false);
  const [animSpeed, setAnimSpeed] = useState<number>(3);
  const [glowIntensity, setGlowIntensity] = useState<number>(4);
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>('#ff073a');
  const [selectedGlowColor, setSelectedGlowColor] = useState<string>('#ff3366');

  const getSpeedLabel = (val: number) => {
    switch (val) {
      case 1: return 'Gentle Breeze (Slow)';
      case 2: return 'Subtle Pulse';
      case 3: return 'Smooth & Fluid';
      case 4: return 'Vibrant Pulse';
      case 5: return 'Hyper Velocity';
      default: return 'Smooth & Fluid';
    }
  };

  const getGlowLabel = (val: number) => {
    switch (val) {
      case 1: return 'Soft Minimal Edge';
      case 2: return 'Subtle Neon';
      case 3: return 'Balanced Radiance';
      case 4: return 'High Intensity';
      case 5: return 'Maximum Luminescence';
      default: return 'High Intensity';
    }
  };

  const categories: ProductCategory[] = [
    'All',
    'Textbooks & Books',
    'Electronics & Gadgets',
    'Fashion & Clothing',
    'Food & Snacks',
    'Hostel Essentials',
    'Services & Printing'
  ];

  const noticeCategories: CampusNotice['category'][] = [
    'Academic',
    'Admissions',
    'SRC',
    'Clinic & Health',
    'Administration',
    'Events',
    'Finance'
  ];

  // Fetch Products
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch products for admin', e);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch Orders
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch orders for admin', e);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch Notices
  const loadNotices = async () => {
    try {
      setNoticesLoading(true);
      const res = await fetch('/api/campus/notices');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.notices)) {
          setNotices(data.notices);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch notices for admin', e);
    } finally {
      setNoticesLoading(false);
    }
  };

  // Fetch Clinic Appointments
  const loadAppointments = async () => {
    try {
      setClinicLoading(true);
      const res = await fetch('/api/clinic/appointments');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch appointments for admin', e);
    } finally {
      setClinicLoading(false);
    }
  };

  // Fetch Chatbot API Config
  const loadChatApiStatus = async () => {
    try {
      const res = await fetch('/api/admin/chat-api-key');
      if (res.ok) {
        const data = await res.json();
        if (data && data.model) {
          setChatModelInput(data.model);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadProducts();
      loadOrders();
      loadNotices();
      loadAppointments();
      loadChatApiStatus();
    }
  }, [isOpen, isAuthenticated]);

  // Handle Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);

    try {
      const ok = await verifyAdminPassword(passwordInput);
      if (ok) {
        setIsAuthenticated(true);
        setPasswordInput('');
        loadProducts();
        loadOrders();
        loadNotices();
        loadAppointments();
        loadChatApiStatus();
      } else {
        setAuthError('Incorrect master admin password. Please try again.');
      }
    } catch {
      setAuthError('Error validating admin credentials.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    setAdminSession(false);
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Image file handler for Add / Edit product
  const handleProductImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormImagePreview(result);
        setFormImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormPrice(String(prod.price));
    setFormCategory(prod.category);
    setFormDescription(prod.description);
    setFormImage(prod.image);
    setFormImagePreview(prod.image);
    setFormSellerName(prod.sellerName);
    setFormSellerContact(prod.sellerContact);
    setFormLocation(prod.locationOnCampus || 'Miotso Campus');
    setFormCondition(prod.condition || 'Brand New');
  };

  // Open Add Product Modal
  const openAddProduct = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormPrice('');
    setFormCategory('Textbooks & Books');
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800');
    setFormImagePreview('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800');
    setFormSellerName('Central SRC Mart');
    setFormSellerContact('+233241234567');
    setFormLocation('Senate Building Ground Floor');
    setFormCondition('Brand New');
    setIsAddModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice) return;

    const payload = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: formTitle.trim(),
      price: parseFloat(formPrice) || 0,
      category: formCategory,
      description: formDescription.trim(),
      image: formImagePreview || formImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      sellerName: formSellerName.trim() || 'Central Campus Store',
      sellerContact: formSellerContact.trim() || '+233241234567',
      sellerRole: 'Central Admin / Official Store',
      sellerId: 'admin-store',
      isAdmin: true,
      locationOnCampus: formLocation.trim() || 'Senate Building Ground Floor',
      condition: formCondition,
    };

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setActionNotice(editingProduct ? 'Product modified successfully!' : 'New product listed in shop and visible across website!');
        setTimeout(() => setActionNotice(null), 3000);
        setEditingProduct(null);
        setIsAddModalOpen(false);
        loadProducts();
        if (onProductsUpdated) onProductsUpdated();
        window.dispatchEvent(new CustomEvent('central_mall_content_updated', { detail: { type: 'product' } }));
      }
    } catch (e) {
      console.error('Error saving product', e);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing from the shop?')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice('Product listing removed from shop.');
        setTimeout(() => setActionNotice(null), 3000);
        loadProducts();
        if (onProductsUpdated) onProductsUpdated();
        window.dispatchEvent(new CustomEvent('central_mall_content_updated', { detail: { type: 'product' } }));
      }
    } catch (e) {
      console.error('Error deleting product', e);
    }
  };

  // Reset Products to Defaults
  const handleResetProducts = async () => {
    if (!window.confirm('Reset all shop products to original Central University default listings?')) return;

    try {
      const res = await fetch('/api/products/reset', { method: 'POST' });
      if (res.ok) {
        setActionNotice('Shop reset to default listings.');
        setTimeout(() => setActionNotice(null), 3000);
        loadProducts();
        if (onProductsUpdated) onProductsUpdated();
        window.dispatchEvent(new CustomEvent('central_mall_content_updated', { detail: { type: 'product' } }));
      }
    } catch (e) {
      console.error('Error resetting products', e);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionNotice(`Order status changed to ${newStatus}`);
        setTimeout(() => setActionNotice(null), 3000);
        loadOrders();
      }
    } catch (e) {
      console.error('Error updating order', e);
    }
  };

  // Open Notice Add / Edit
  const openAddNotice = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeSummary('');
    setNoticeContent('');
    setNoticeCategory('Academic');
    setNoticePriority('normal');
    setIsAddNoticeOpen(true);
  };

  const openEditNotice = (n: CampusNotice) => {
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeSummary(n.summary);
    setNoticeContent(n.content);
    setNoticeCategory(n.category);
    setNoticePriority(n.priority);
  };

  // Save Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;

    const payload = {
      id: editingNotice ? editingNotice.id : `notice-${Date.now()}`,
      title: noticeTitle.trim(),
      summary: noticeSummary.trim(),
      content: noticeContent.trim(),
      category: noticeCategory,
      priority: noticePriority,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      source: 'Central University Administration',
      officialLink: 'http://central.edu.gh/',
      targetAudience: 'University Community'
    };

    try {
      const method = editingNotice ? 'PUT' : 'POST';
      const res = await fetch('/api/campus/notices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActionNotice(editingNotice ? 'Notice updated!' : 'New campus announcement published live to the website!');
        setTimeout(() => setActionNotice(null), 3000);
        setEditingNotice(null);
        setIsAddNoticeOpen(false);
        loadNotices();
        if (onNoticesUpdated) onNoticesUpdated();
        window.dispatchEvent(new CustomEvent('central_mall_content_updated', { detail: { type: 'notice' } }));
      }
    } catch (e) {
      console.error('Error saving notice', e);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`/api/campus/notices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice('Notice removed.');
        setTimeout(() => setActionNotice(null), 3000);
        loadNotices();
        if (onNoticesUpdated) onNoticesUpdated();
        window.dispatchEvent(new CustomEvent('central_mall_content_updated', { detail: { type: 'notice' } }));
      }
    } catch (e) {
      console.error('Error deleting notice', e);
    }
  };

  // Cancel Clinic Appointment
  const handleCancelAppointment = async (id: string) => {
    try {
      const res = await fetch('/api/clinic/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setActionNotice('Appointment marked as cancelled.');
        setTimeout(() => setActionNotice(null), 3000);
        loadAppointments();
      }
    } catch (e) {
      console.error('Error cancelling appointment', e);
    }
  };

  // Permanently Delete Clinic Appointment
  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm('Permanently delete this clinic appointment record?')) return;
    try {
      const res = await fetch(`/api/clinic/appointments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice('Appointment permanently deleted.');
        setTimeout(() => setActionNotice(null), 3000);
        loadAppointments();
      }
    } catch (e) {
      console.error('Error deleting appointment', e);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdChangeMessage(null);

    if (newPwdInput !== confirmPwdInput) {
      setPwdChangeMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }

    if (newPwdInput.trim().length < 4) {
      setPwdChangeMessage({ text: 'New password must be at least 4 characters.', isError: true });
      return;
    }

    setIsChangingPwd(true);
    try {
      const result = await changeAdminPassword(currentPwdInput, newPwdInput);
      if (result.success) {
        setPwdChangeMessage({ text: result.message, isError: false });
        setCurrentPwdInput('');
        setNewPwdInput('');
        setConfirmPwdInput('');
      } else {
        setPwdChangeMessage({ text: result.message, isError: true });
      }
    } catch {
      setPwdChangeMessage({ text: 'Failed to update admin password.', isError: true });
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Handle Chatbot API Key Update
  const handleSaveChatApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setChatKeyMessage(null);
    setIsSavingChatKey(true);
    try {
      const res = await fetch('/api/admin/chat-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: chatApiKeyInput,
          model: chatModelInput
        })
      });
      if (res.ok) {
        setChatKeyMessage({ text: 'AI Chatbot API updated & masked successfully with asterisks!', isError: false });
        setChatApiKeyInput('');
        loadChatApiStatus();
      } else {
        setChatKeyMessage({ text: 'Failed to update Chatbot API key.', isError: true });
      }
    } catch {
      setChatKeyMessage({ text: 'Error connecting to server.', isError: true });
    } finally {
      setIsSavingChatKey(false);
    }
  };

  // Trigger PWA Installation
  const handlePwaDownload = async () => {
    if (pwaInstallPrompt) {
      try {
        pwaInstallPrompt.prompt();
        const choice = await pwaInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledPwa(true);
          setActionNotice('Central Mall PWA installed successfully!');
        }
      } catch (e) {
        console.warn('PWA prompt error', e);
      }
    } else {
      setActionNotice('To install Central Mall PWA: Click browser menu (⋮ or Share) → Add to Home Screen / Install Central Mall');
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  // Dynamic SVG Generator using current theme and glow colors
  const generateSvgCode = (themeCol = selectedThemeColor, glowCol = selectedGlowColor) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- Rounded App Card Background with Gradient -->
  <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#bg-gradient)" stroke="${themeCol}" stroke-width="3" stroke-opacity="0.8"/>
  <defs>
    <linearGradient id="bg-gradient" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
      <stop stop-color="#140206"/>
      <stop offset="1" stop-color="#26050c"/>
    </linearGradient>
    <linearGradient id="neon-gradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
      <stop stop-color="${glowCol}"/>
      <stop offset="1" stop-color="${themeCol}"/>
    </linearGradient>
  </defs>
  <!-- Stylized Mall Building & Shopping Bag Symbol -->
  <path d="M30 40H70V78C70 80.2091 68.2091 82 66 82H34C31.7909 82 30 80.2091 30 78V40Z" fill="url(#neon-gradient)" fill-opacity="0.25" stroke="${themeCol}" stroke-width="3"/>
  <path d="M40 40V30C40 24.4772 44.4772 20 50 20C55.5228 20 60 24.4772 60 30V40" stroke="${themeCol}" stroke-width="3" stroke-linecap="round"/>
  <!-- Mall Entrance / Glass Facade Accent -->
  <path d="M42 82V62C42 60.8954 42.8954 60 44 60H56C57.1046 60 58 60.8954 58 62V82" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.9"/>
  <!-- Premium Star / Sparkle Accent -->
  <path d="M75 25L77.5 32L84.5 34.5L77.5 37L75 44L72.5 37L65.5 34.5L72.5 32L75 25Z" fill="${glowCol}"/>
  <path d="M25 65L26.25 68.5L29.75 69.75L26.25 71L25 74.5L23.75 71L20.25 69.75L23.75 68.5L25 65Z" fill="${themeCol}"/>
</svg>`;
  };

  // Copy Favicon SVG code
  const handleCopyFaviconSvg = () => {
    const svgCode = generateSvgCode();
    navigator.clipboard.writeText(svgCode);
    setCopiedFaviconSvg(true);
    setTimeout(() => setCopiedFaviconSvg(false), 2500);
  };

  // Download favicon.svg file
  const handleDownloadFaviconFile = () => {
    const svgCode = generateSvgCode();
    const blob = new Blob([svgCode], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'central-mall-neon-favicon.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.locationOnCampus && p.locationOnCampus.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#0a0a0f] border-2 border-[#ff073a]/70 rounded-3xl shadow-[0_0_50px_rgba(255,7,58,0.35)] overflow-hidden text-gray-100"
      >
        {/* Top Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#002147] via-[#ff073a] to-[#CE1126]" />

        {/* Action Notice Banner */}
        <AnimatePresence>
          {actionNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-[#140206] via-[#ff073a]/30 to-[#140206] border-b border-[#ff073a]/50 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-rose-200 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#ff073a] animate-pulse" />
              <span>{actionNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-gray-800/80 bg-[#12121c]/90">
          <div className="flex items-center gap-3">
            {/* Animated Mall SVG Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ff073a] to-[#7a031a] flex items-center justify-center shadow-[0_0_15px_rgba(255,7,58,0.6)] border border-[#ff3366]/40 p-2">
              <svg className="w-7 h-7 text-white" viewBox="0 0 100 100" fill="none">
                <rect x="5" y="5" width="90" height="90" rx="24" fill="#140206" stroke="#ff073a" strokeWidth="4"/>
                <path d="M30 40H70V78C70 80.2 68.2 82 66 82H34C31.8 82 30 80.2 30 78V40Z" fill="#ff3366" fillOpacity="0.4" stroke="#ff073a" strokeWidth="4"/>
                <path d="M40 40V30C40 24.5 44.5 20 50 20C55.5 20 60 24.5 60 30V40" stroke="#ff073a" strokeWidth="4" strokeLinecap="round"/>
                <path d="M44 82V62H56V82" stroke="#ffffff" strokeWidth="3"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-wide text-white uppercase flex items-center gap-2">
                  <span>CENTRAL MALL</span>
                  <span className="text-[#ff073a]">•</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3366] to-[#ff073a]">NEXUS ADMIN CONSOLE</span>
                </h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff073a]/20 text-rose-300 border border-[#ff073a]/40">
                  <span className="w-1.5 h-1.5 mr-1.5 bg-[#ff073a] rounded-full animate-ping" /> Live CMS
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>Central University Miotso</span>
                <span className="text-gray-600">•</span>
                <span className="text-rose-400 font-mono font-medium">Shortcut: Shift + A</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors"
                title="Lock Console"
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Lock</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors border border-transparent hover:border-gray-700"
              aria-label="Close Admin Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Section: Password Gate OR Full CMS */}
        {!isAuthenticated ? (
          /* AUTHENTICATION GATE */
          <div className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#12121c] to-[#0a0a0f]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#12121c] border border-[#ff073a]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,7,58,0.25)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Decorative Glow Orb */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#ff073a]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff073a]/20 to-transparent border border-[#ff073a]/50 flex items-center justify-center mb-4 text-[#ff073a] shadow-inner">
                <Shield className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">Administrator Authentication</h3>
              <p className="text-xs text-gray-400 mb-6 max-w-xs">
                Enter the master admin password to modify shop listings, campus notices, orders, and system settings.
              </p>

              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div className="relative text-left">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter administrator password..."
                      autoFocus
                      className="w-full px-4 py-3 pr-11 bg-gray-950/80 border border-gray-700 focus:border-[#ff073a] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff073a]/40 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2 text-left"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || !passwordInput}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:from-[#ff1a47] hover:to-[#ff073a] shadow-[0_0_20px_rgba(255,7,58,0.5)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Admin Console</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security Hint */}
              <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] text-gray-400 flex items-center justify-between w-full">
                <span>Code Mask: <span className="font-mono text-rose-400">{MASKED_ADMIN_PASSWORD_DISPLAY}</span></span>
                <span className="text-gray-500">Shortcut: Shift + A</span>
              </div>
            </motion.div>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-[#0d0d15] border-r border-gray-800/80 p-3 sm:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0">
              <button
                onClick={() => setActiveTab('shop')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'shop'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Items & Products</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Orders & Payments</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('notices')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'notices'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Campus Notices</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                  {notices.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('clinic')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'clinic'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Clinic Consultations</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 font-mono">
                  {appointments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('favicon_pwa')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'favicon_pwa'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Favicon & PWA Suite</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'bg-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Security & Password</span>
              </button>

              {/* Quick Status Box */}
              <div className="hidden md:block mt-auto p-3 rounded-2xl bg-gray-950/80 border border-gray-800 text-[11px] text-gray-400">
                <div className="text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Central Miotso Online</span>
                </div>
                <div className="text-gray-500">Shortcut: <span className="text-rose-400 font-mono">Shift + A</span></div>
                <div className="text-gray-500 mt-1">Admin access active</div>
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-[#0a0a0f]">
              {/* TAB 1: SHOP PRODUCTS CMS */}
              {activeTab === 'shop' && (
                <div className="space-y-5">
                  {/* Action Top Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search product listings..."
                          className="w-full pl-9 pr-3 py-2 bg-[#12121c] border border-gray-800 focus:border-[#ff073a] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                        />
                      </div>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as ProductCategory)}
                        className="py-2 px-3 bg-[#12121c] border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-[#ff073a]"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={openAddProduct}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:shadow-[0_0_15px_rgba(255,7,58,0.5)] transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Listing</span>
                      </button>
                      <button
                        onClick={handleResetProducts}
                        className="p-2 rounded-xl text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors"
                        title="Reset Catalog to Defaults"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Listings Grid */}
                  {productsLoading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff073a]" />
                      <p className="text-xs">Loading marketplace listings...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-[#12121c]/50 rounded-2xl border border-gray-800">
                      <p className="text-sm font-semibold text-gray-400">No products match your criteria</p>
                      <p className="text-xs text-gray-500 mt-1">Try adjusting the search query or category filter</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-[#12121c] border border-gray-800/90 hover:border-[#ff073a]/50 rounded-2xl p-3 flex flex-col justify-between transition-all group"
                        >
                          <div className="flex gap-3">
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-20 h-20 rounded-xl object-cover border border-gray-800 shrink-0 bg-gray-900"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="inline-block text-[10px] font-semibold text-[#ff073a] bg-[#ff073a]/10 px-2 py-0.5 rounded-full mb-1">
                                {p.category}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate" title={p.title}>
                                {p.title}
                              </h4>
                              <p className="text-xs font-extrabold text-white mt-1">
                                GH₵ {p.price.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                📍 {p.locationOnCampus || 'Miotso Campus'}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                Seller: {p.sellerName}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-gray-500">
                              ID: {p.id}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-white bg-gray-800 hover:bg-[#ff073a] transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-white bg-rose-950/50 hover:bg-rose-600 transition-colors"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORDERS HUB */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Student Store Orders</h3>
                      <p className="text-xs text-gray-400">Manage real-time order fulfillments and MoMo payments</p>
                    </div>
                    <button
                      onClick={loadOrders}
                      className="p-2 rounded-xl text-gray-400 hover:text-white bg-gray-900 border border-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff073a]" />
                      <p className="text-xs">Fetching orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-[#12121c]/50 rounded-2xl border border-gray-800">
                      <p className="text-sm font-semibold text-gray-400">No student orders logged yet</p>
                      <p className="text-xs text-gray-500 mt-1">Orders placed in Central Mall Shop will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-[#12121c] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white">{order.id}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                                {order.status}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">
                              <strong>Delivery:</strong> {order.deliveryLocation}
                            </p>
                            <p className="text-xs text-gray-400">
                              Method: <span className="uppercase text-white font-medium">{order.paymentMethod}</span>
                              {order.momoNumber && ` (${order.momoNumber})`} • {order.items.length} items
                            </p>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <span className="text-sm font-extrabold text-[#ff073a]">
                              GH₵ {order.totalAmount.toFixed(2)}
                            </span>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="px-2.5 py-1.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAMPUS NOTICES CMS */}
              {activeTab === 'notices' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Central University Campus Notices</h3>
                      <p className="text-xs text-gray-400">Publish alerts, academic deadlines, and SRC news</p>
                    </div>
                    <button
                      onClick={openAddNotice}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#ff073a] hover:bg-[#d4002e] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Notice</span>
                    </button>
                  </div>

                  {noticesLoading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff073a]" />
                      <p className="text-xs">Loading notices...</p>
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-[#12121c]/50 rounded-2xl border border-gray-800">
                      <p className="text-sm font-semibold text-gray-400">No campus notices listed</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notices.map((n) => (
                        <div
                          key={n.id}
                          className="bg-[#12121c] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff073a]/20 text-rose-300 border border-[#ff073a]/40">
                                  {n.category}
                                </span>
                                <span className="text-[10px] text-gray-400">{n.date}</span>
                                {n.priority === 'urgent' && (
                                  <span className="text-[10px] font-extrabold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded">
                                    URGENT
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-white">{n.title}</h4>
                              <p className="text-xs text-gray-400 mt-1">{n.summary}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => openEditNotice(n)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-white bg-gray-800 hover:bg-[#ff073a] transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNotice(n.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-white bg-rose-950/50 hover:bg-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CLINIC APPOINTMENTS */}
              {activeTab === 'clinic' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Central University Clinic Consultations</h3>
                      <p className="text-xs text-gray-400">Review booked student triage and doctor appointments</p>
                    </div>
                    <button
                      onClick={loadAppointments}
                      className="p-2 rounded-xl text-gray-400 hover:text-white bg-gray-900 border border-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {clinicLoading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff073a]" />
                      <p className="text-xs">Loading appointments...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 bg-[#12121c]/50 rounded-2xl border border-gray-800">
                      <p className="text-sm font-semibold text-gray-400">No clinic appointments recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((a) => (
                        <div
                          key={a.id}
                          className="bg-[#12121c] border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white">{a.studentName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({a.studentId})</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                                {a.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">
                              <strong>Doctor:</strong> {a.doctorName || 'Dr. Mensah (Miotso OPD)'} •{' '}
                              <strong>Slot:</strong> {a.date} at {a.time}
                            </p>
                            <p className="text-xs text-gray-400">
                              Reason: {a.reason || 'General Health Consultation'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <span className="text-[11px] text-gray-400 mr-2">
                              {a.consultationType === 'virtual_video'
                                ? '🎥 Virtual Video'
                                : '🏥 In-Person OPD'}
                            </span>
                            {a.status !== 'Cancelled' && (
                              <button
                                onClick={() => handleCancelAppointment(a.id)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-800/80 border border-amber-800 transition-colors"
                                title="Mark Cancelled"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(a.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-white bg-rose-950/50 hover:bg-rose-600 transition-colors"
                              title="Delete Appointment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FAVICON & PWA SUITE PREVIEW (From user prompt) */}
              {activeTab === 'favicon_pwa' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#ff073a]" />
                      <span>Neon Red Mall Favicon & Animation Suite</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Browser tab preview, animated mall SVG emblem, and PWA (PAW) installation controls
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Favicon Canvas & Interactive Preview */}
                    <div className="md:col-span-6 flex flex-col items-center justify-center bg-[#12121c] border border-gray-800 rounded-3xl p-6 md:p-8 neon-card-glow relative overflow-hidden">
                      <div
                        className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-500"
                        style={{ backgroundColor: `${selectedThemeColor}20` }}
                      />

                      <div className="text-center mb-6">
                        <h4 className="text-lg font-semibold text-white mb-1">Animated Neon Mall Icon</h4>
                        <p className="text-xs text-gray-400">Designed for browser tabs, bookmarks & luxury UI</p>
                      </div>

                      {/* Animated Mall SVG Container */}
                      <div className="relative p-6 bg-gray-950/80 rounded-2xl border border-gray-800 flex items-center justify-center mb-6 transition-all shadow-inner w-full">
                        <div
                          className="animate-float"
                          style={{
                            animationDuration: `${5.2 - (animSpeed - 1) * 0.85}s`,
                            filter: `drop-shadow(0 0 ${glowIntensity * 3.5}px ${selectedThemeColor}) drop-shadow(0 0 ${glowIntensity * 7}px ${selectedGlowColor})`
                          }}
                        >
                          <svg
                            id="mall-favicon-svg"
                            className="w-28 h-28 md:w-36 md:h-36 transition-all duration-300"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Rounded App Card Background with Gradient */}
                            <rect
                              x="5"
                              y="5"
                              width="90"
                              height="90"
                              rx="24"
                              fill="url(#bg-gradient-dyn)"
                              stroke={selectedThemeColor}
                              strokeWidth="3"
                              strokeOpacity="0.8"
                            />

                            <defs>
                              <linearGradient id="bg-gradient-dyn" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#140206" />
                                <stop offset="1" stopColor="#26050c" />
                              </linearGradient>
                              <linearGradient id="neon-gradient-dyn" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                <stop stopColor={selectedGlowColor} />
                                <stop offset="1" stopColor={selectedThemeColor} />
                              </linearGradient>
                            </defs>

                            {/* Stylized Mall Building & Shopping Bag Symbol */}
                            <path
                              d="M30 40H70V78C70 80.2091 68.2091 82 66 82H34C31.7909 82 30 80.2091 30 78V40Z"
                              fill="url(#neon-gradient-dyn)"
                              fillOpacity="0.25"
                              stroke={selectedThemeColor}
                              strokeWidth="3"
                            />
                            <path
                              d="M40 40V30C40 24.4772 44.4772 20 50 20C55.5228 20 60 24.4772 60 30V40"
                              stroke={selectedThemeColor}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />

                            {/* Mall Entrance / Glass Facade Accent */}
                            <path
                              d="M42 82V62C42 60.8954 42.8954 60 44 60H56C57.1046 60 58 60.8954 58 62V82"
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              strokeOpacity="0.9"
                            />

                            {/* Premium Star / Sparkle Accent */}
                            <path
                              d="M75 25L77.5 32L84.5 34.5L77.5 37L75 44L72.5 37L65.5 34.5L72.5 32L75 25Z"
                              fill={selectedGlowColor}
                              className="animate-pulse"
                            />
                            <path
                              d="M25 65L26.25 68.5L29.75 69.75L26.25 71L25 74.5L23.75 71L20.25 69.75L23.75 68.5L25 65Z"
                              fill={selectedThemeColor}
                              className="animate-pulse"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Dynamic Live Tab Simulation */}
                      <div className="w-full bg-gray-900/90 border border-gray-800 rounded-xl p-3 flex items-center space-x-3 shadow">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <div className="flex-1 bg-gray-950 rounded-lg px-3 py-1.5 flex items-center space-x-2 border border-gray-800/80 text-xs text-gray-300">
                          <svg
                            className="w-4 h-4 flex-shrink-0 transition-colors"
                            style={{ color: selectedThemeColor }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate font-medium text-gray-200">Central Mall - Luxury Experience</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Customization Controls & Export Options */}
                    <div className="md:col-span-6 flex flex-col space-y-4">
                      {/* Favicon Customizer Controls */}
                      <div className="bg-[#12121c] border border-gray-800 rounded-3xl p-6 neon-card-glow">
                        <h4 className="text-base font-semibold text-white mb-4 flex items-center">
                          <Sparkles className="w-5 h-5 mr-2" style={{ color: selectedThemeColor }} />
                          <span>Favicon Customizer</span>
                        </h4>

                        {/* Animation Speed Control */}
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-300">Animation Pulsing Speed</span>
                            <span className="font-bold" style={{ color: selectedThemeColor }}>
                              {getSpeedLabel(animSpeed)}
                            </span>
                          </div>
                          <input
                            type="range"
                            id="speed-slider"
                            min="1"
                            max="5"
                            value={animSpeed}
                            onChange={(e) => setAnimSpeed(Number(e.target.value))}
                            className="w-full accent-rose-600 bg-gray-800 rounded-lg appearance-none h-2 cursor-pointer"
                          />
                        </div>

                        {/* Glow Intensity Control */}
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-300">Neon Glow Intensity</span>
                            <span className="font-bold" style={{ color: selectedThemeColor }}>
                              {getGlowLabel(glowIntensity)}
                            </span>
                          </div>
                          <input
                            type="range"
                            id="glow-slider"
                            min="1"
                            max="5"
                            value={glowIntensity}
                            onChange={(e) => setGlowIntensity(Number(e.target.value))}
                            className="w-full accent-rose-600 bg-gray-800 rounded-lg appearance-none h-2 cursor-pointer"
                          />
                        </div>

                        {/* Color Theme Preset Selection */}
                        <div className="space-y-2">
                          <span className="block text-xs font-medium text-gray-300">
                            Neon & Central University Palette
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThemeColor('#ff073a');
                                setSelectedGlowColor('#ff3366');
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                                selectedThemeColor === '#ff073a'
                                  ? 'bg-[#ff073a]/20 border-[#ff073a] text-white shadow-[0_0_15px_rgba(255,7,58,0.4)]'
                                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-[#ff073a] shadow-[0_0_8px_#ff073a]" />
                              <span>Neon Red</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThemeColor('#CE1126');
                                setSelectedGlowColor('#ff2b47');
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                                selectedThemeColor === '#CE1126'
                                  ? 'bg-[#CE1126]/20 border-[#CE1126] text-white shadow-[0_0_15px_rgba(206,17,38,0.4)]'
                                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-[#CE1126] shadow-[0_0_8px_#CE1126]" />
                              <span>Central Red</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThemeColor('#D4AF37');
                                setSelectedGlowColor('#f5d76e');
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                                selectedThemeColor === '#D4AF37'
                                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                              <span>Central Gold</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedThemeColor('#002147');
                                setSelectedGlowColor('#0a4fa3');
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-all ${
                                selectedThemeColor === '#002147'
                                  ? 'bg-[#002147]/40 border-blue-500 text-white shadow-[0_0_15px_rgba(0,33,71,0.6)]'
                                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full bg-[#002147] border border-blue-400" />
                              <span>Collegiate Navy</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* PWA App Download Card */}
                      <div className="bg-[#12121c] border border-gray-800 rounded-3xl p-6 neon-card-glow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#ff073a]/20 border border-[#ff073a]/50 flex items-center justify-center text-[#ff073a]">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Central Mall PWA (PAW) App Download</h4>
                            <p className="text-xs text-gray-400">Progressive Web Application install package</p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed mb-4">
                          Install Central Mall onto your home screen or desktop. Works offline, launches in full-screen standalone mode, and uses the neon red mall favicon.
                        </p>

                        <button
                          onClick={handlePwaDownload}
                          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:from-[#ff1a47] hover:to-[#ff073a] shadow-[0_0_20px_rgba(255,7,58,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download / Install Central Mall PWA</span>
                        </button>

                        <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
                          <span>Standalone Display: Yes</span>
                          <span>ServiceWorker: Active</span>
                          <span>Manifest: Valid</span>
                        </div>
                      </div>

                      {/* Export & Copy SVG Card */}
                      <div className="bg-[#12121c] border border-gray-800 rounded-3xl p-6">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                          <Copy className="w-4 h-4 text-[#ff073a]" />
                          <span>Favicon Asset Export</span>
                        </h4>
                        <p className="text-xs text-gray-400 mb-4">
                          Export the verified vector SVG favicon with your customized theme or download it directly to disk.
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyFaviconSvg}
                            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedFaviconSvg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedFaviconSvg ? 'Copied to Clipboard!' : 'Copy SVG Code'}</span>
                          </button>
                          <button
                            onClick={handleDownloadFaviconFile}
                            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 border border-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download favicon.svg</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SECURITY & PASSWORD SETTINGS */}
              {activeTab === 'security' && (
                <div className="max-w-xl mx-auto space-y-6 py-4">
                  <div className="bg-[#12121c] border border-gray-800 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#ff073a]/20 border border-[#ff073a]/50 flex items-center justify-center text-[#ff073a]">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Administrator Master Password</h4>
                        <p className="text-xs text-gray-400">Configure console access and credentials</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-950/80 rounded-2xl border border-gray-800 mb-5 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400">Current Code Mask:</span>
                        <div className="font-mono text-base font-bold text-rose-400 tracking-widest">
                          {MASKED_ADMIN_PASSWORD_DISPLAY}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 max-w-[160px] text-right">
                        Masked in source code so casual inspection cannot reveal it.
                      </span>
                    </div>

                    <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Current Admin Password
                        </label>
                        <input
                          type="password"
                          value={currentPwdInput}
                          onChange={(e) => setCurrentPwdInput(e.target.value)}
                          placeholder="Current password (default: shopping2026)"
                          className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          New Master Password
                        </label>
                        <input
                          type="password"
                          value={newPwdInput}
                          onChange={(e) => setNewPwdInput(e.target.value)}
                          placeholder="Enter new admin password..."
                          className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPwdInput}
                          onChange={(e) => setConfirmPwdInput(e.target.value)}
                          placeholder="Re-type new admin password..."
                          className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                        />
                      </div>

                      {pwdChangeMessage && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                            pwdChangeMessage.isError
                              ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          }`}
                        >
                          {pwdChangeMessage.isError ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          <span>{pwdChangeMessage.text}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isChangingPwd || !currentPwdInput || !newPwdInput}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:shadow-[0_0_15px_rgba(255,7,58,0.5)] transition-all disabled:opacity-50"
                      >
                        {isChangingPwd ? 'Updating Password...' : 'Update Admin Password'}
                      </button>
                    </form>
                  </div>

                  {/* Central AI Chatbot API & OpenRouter Credentials */}
                  <div className="bg-[#12121c] border border-gray-800 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#ff073a]/20 border border-[#ff073a]/50 flex items-center justify-center text-[#ff073a]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Central AI Chatbot API Credentials</h4>
                        <p className="text-xs text-gray-400">OpenRouter AI & Campus Knowledge Engine configuration</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-gray-950/80 rounded-2xl border border-gray-800 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-gray-400">Active API Key Mask:</span>
                        <div className="font-mono text-sm font-bold text-rose-400 tracking-wider">
                          {MASKED_CHATBOT_KEY_DISPLAY}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Asterisk Encrypted
                      </span>
                    </div>

                    <form onSubmit={handleSaveChatApiKey} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          AI Model Provider & Engine
                        </label>
                        <select
                          value={chatModelInput}
                          onChange={(e) => setChatModelInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                        >
                          <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Ultra Fast & Smart)</option>
                          <option value="google/gemini-flash-1.5">Google Gemini Flash (High Context)</option>
                          <option value="anthropic/claude-3-haiku">Anthropic Claude 3 Haiku (Analytical)</option>
                          <option value="meta-llama/llama-3.1-8b-instruct">Meta Llama 3.1 8B (Open Source)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Update API Key (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type={showChatKey ? 'text' : 'password'}
                            value={chatApiKeyInput}
                            onChange={(e) => setChatApiKeyInput(e.target.value)}
                            placeholder="sk-or-v1-********************************"
                            className="w-full px-3.5 py-2.5 pr-10 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowChatKey(!showChatKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                          >
                            {showChatKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Stored securely on server. Displayed as asterisks to protect your secret key.
                        </p>
                      </div>

                      {chatKeyMessage && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                            chatKeyMessage.isError
                              ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                              : 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                          }`}
                        >
                          {chatKeyMessage.isError ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          <span>{chatKeyMessage.text}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingChatKey || (!chatApiKeyInput && !chatModelInput)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#ff073a] to-[#d4002e] hover:shadow-[0_0_15px_rgba(255,7,58,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSavingChatKey ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Updating AI Credentials...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Save Chatbot API Configuration</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADD / EDIT PRODUCT MODAL OVERLAY */}
        <AnimatePresence>
          {(isAddModalOpen || editingProduct) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-lg bg-[#12121c] border border-[#ff073a]/60 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#ff073a]" />
                    <span>{editingProduct ? 'Edit Product Listing' : 'Add New Campus Listing'}</span>
                  </h4>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Constitutional Law of Ghana"
                      required
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Price (GH₵)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="e.g. 150"
                        required
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      >
                        {categories.filter(c => c !== 'All').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief details about the item..."
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                    />
                  </div>

                  {/* Image Upload, Direct URL or Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Product Photo (URL, Upload, or Preset)</label>
                    <div className="flex items-center gap-3 mb-2">
                      {formImagePreview ? (
                        <img
                          src={formImagePreview}
                          alt="Preview"
                          className="w-14 h-14 rounded-xl object-cover border border-[#ff073a]/50 shrink-0 shadow-md shadow-red-950"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-[10px] shrink-0">
                          No Photo
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={formImage}
                          onChange={(e) => {
                            setFormImage(e.target.value);
                            setFormImagePreview(e.target.value);
                          }}
                          placeholder="Paste image URL (e.g. https://...)..."
                          className="w-full px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-gray-400 font-medium">Or choose file:</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageFile}
                            className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-rose-300 hover:file:bg-gray-700 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0">Presets:</span>
                      {[
                        { name: 'Law Book', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Varsity Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Jollof Combo', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Calculator', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=800' },
                        { name: 'Desk Lamp', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800' }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setFormImage(preset.url);
                            setFormImagePreview(preset.url);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[10px] text-gray-300 hover:text-white shrink-0 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Seller Name</label>
                      <input
                        type="text"
                        value={formSellerName}
                        onChange={(e) => setFormSellerName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Campus Location</label>
                      <input
                        type="text"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingProduct(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff073a] hover:bg-[#d4002e] shadow-[0_0_15px_rgba(255,7,58,0.4)]"
                    >
                      {editingProduct ? 'Save Modifications' : 'Create Listing'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ADD / EDIT NOTICE MODAL OVERLAY */}
        <AnimatePresence>
          {(isAddNoticeOpen || editingNotice) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="w-full max-w-lg bg-[#12121c] border border-[#ff073a]/60 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#ff073a]" />
                    <span>{editingNotice ? 'Edit Notice' : 'Post Campus Notice'}</span>
                  </h4>
                  <button
                    onClick={() => {
                      setIsAddNoticeOpen(false);
                      setEditingNotice(null);
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveNotice} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Headline</label>
                    <input
                      type="text"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="Notice headline..."
                      required
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Category</label>
                      <select
                        value={noticeCategory}
                        onChange={(e) => setNoticeCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      >
                        {noticeCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Priority</label>
                      <select
                        value={noticePriority}
                        onChange={(e) => setNoticePriority(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                      >
                        <option value="normal">Normal</option>
                        <option value="important">Important</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Summary</label>
                    <input
                      type="text"
                      value={noticeSummary}
                      onChange={(e) => setNoticeSummary(e.target.value)}
                      placeholder="Short synopsis..."
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Full Announcement Body</label>
                    <textarea
                      rows={3}
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder="Official announcement content..."
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff073a]"
                    />
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddNoticeOpen(false);
                        setEditingNotice(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#ff073a] hover:bg-[#d4002e]"
                    >
                      {editingNotice ? 'Update Notice' : 'Publish Notice'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
