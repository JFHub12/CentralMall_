import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Search, PlusCircle, ShoppingCart, ArrowLeft, Tag, MapPin, 
  User, Phone, CheckCircle2, X, CreditCard, Smartphone, DollarSign, Sparkles,
  Edit3, Trash2, Camera, Upload, Image as ImageIcon, Check, RefreshCw,
  SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { Product, ProductCategory, CartItem, PaymentMethod, Order } from '../types';
import { INITIAL_PRODUCTS } from '../data';
import { CartPushLoadingSVG } from './CartPushLoadingSVG';
import { 
  ClothingFilterPanel, 
  ClothingSize, 
  ClothingColorKey, 
  CLOTHING_COLORS 
} from './ClothingFilterPanel';

interface ShopViewProps {
  user: any;
  onBackToDashboard: () => void;
  initialSearchQuery?: string;
  initialOpenSellModal?: boolean;
}

export const ShopView: React.FC<ShopViewProps> = ({ 
  user, 
  onBackToDashboard, 
  initialSearchQuery = '',
  initialOpenSellModal = false
}) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'My Listed Items'>('All');

  // Clothing Department Filter State (Size & Color swatches)
  const [selectedSizes, setSelectedSizes] = useState<ClothingSize[]>([]);
  const [selectedColor, setSelectedColor] = useState<ClothingColorKey | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  
  // Modals & Drawers
  const [showSellModal, setShowSellModal] = useState(initialOpenSellModal);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Form State for Listing Item to Sell (Anyone Can Sell)
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Textbooks & Books');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [sellerName, setSellerName] = useState(user?.name || '');
  const [sellerContact, setSellerContact] = useState(user?.phone || '');
  const [sellerRole, setSellerRole] = useState<'Student' | 'Campus Merchant' | 'Hostel Resident' | 'Faculty / Staff' | 'Visitor / Alum'>('Student');
  const [locationOnCampus, setLocationOnCampus] = useState('Trinity Hall Porter Desk');
  const [condition, setCondition] = useState<'Brand New' | 'Like New' | 'Fair'>('Brand New');
  const [acceptedPayments, setAcceptedPayments] = useState<string[]>(['MTN MoMo', 'Cash on Delivery']);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State for Editing an existing Item
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('Textbooks & Books');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editLocation, setEditLocation] = useState('');
  const [editCondition, setEditCondition] = useState<'Brand New' | 'Like New' | 'Fair'>('Brand New');
  const [editContact, setEditContact] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Checkout Form State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [momoNumber, setMomoNumber] = useState(user?.phone || '');
  const [deliveryLocation, setDeliveryLocation] = useState('Trinity Hall Porter Desk');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Live Exchange Rate State
  const [usdRate, setUsdRate] = useState<number | null>(null);

  // Sample quick image presets
  const samplePresets = [
    { label: 'Law Book', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800' },
    { label: 'Laptop', url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800' },
    { label: 'Hoodie', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800' },
    { label: 'Jollof Rice', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800' },
    { label: 'Scientific Calc', url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=800' },
    { label: 'Desk Lamp', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800' }
  ];

  // Fetch Products & Exchange Rates from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from products API');
      }
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.warn('Products API notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handleUpdate = () => {
      fetchProducts();
    };
    window.addEventListener('central_mall_content_updated', handleUpdate);

    fetch('/api/rates')
      .then(async res => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.usdRate) setUsdRate(data.usdRate);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('central_mall_content_updated', handleUpdate);
    };
  }, []);

  // Handle local image file upload into Base64 for Sell Modal
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setImagePreview(resultStr);
        setImage(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image file upload for Edit Modal
  const handleEditImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setEditImagePreview(resultStr);
        setEditImage(resultStr);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cart Management
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle Sell Form Submission
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !sellerName || !sellerContact) return;

    setSubmittingProduct(true);
    setStatusMessage(null);

    const finalImage = imagePreview || image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          price: parseFloat(price),
          category,
          description: description.trim(),
          image: finalImage,
          sellerName: sellerName.trim(),
          sellerContact: sellerContact.trim(),
          sellerRole: sellerRole || (user?.role === 'merchant' ? 'Campus Merchant' : 'Student Seller'),
          sellerId: user?.id || 'usr-custom',
          locationOnCampus,
          condition,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        setShowSellModal(false);

        // Reset form
        setTitle('');
        setPrice('');
        setDescription('');
        setImage('');
        setImagePreview('');
        setStatusMessage('Item posted successfully with your photo!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error listing product', err);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Open Edit Modal for a product
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditPrice(product.price.toString());
    setEditCategory(product.category);
    setEditDescription(product.description || '');
    setEditImage(product.image);
    setEditImagePreview(product.image);
    setEditLocation(product.locationOnCampus || 'Miotso Campus');
    setEditCondition(product.condition || 'Brand New');
    setEditContact(product.sellerContact || user?.phone || '');
    setShowEditModal(true);
  };

  // Handle Edit Submit
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editTitle || !editPrice) return;

    setSubmittingEdit(true);
    const finalImage = editImagePreview || editImage || editingProduct.image;

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          title: editTitle.trim(),
          price: parseFloat(editPrice),
          category: editCategory,
          description: editDescription.trim(),
          image: finalImage,
          locationOnCampus: editLocation,
          condition: editCondition,
          sellerContact: editContact,
        }),
      });

      if (res.ok) {
        await fetchProducts();
        setShowEditModal(false);
        setEditingProduct(null);
        setStatusMessage('Item updated successfully!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating product', err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;

    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setStatusMessage('Listing deleted successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error deleting product', err);
    }
  };

  // Handle Checkout & Order Placement
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setProcessingPayment(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount: cartTotal,
          paymentMethod,
          momoNumber: paymentMethod !== 'card' && paymentMethod !== 'cod' ? momoNumber : undefined,
          deliveryLocation,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error('Expected JSON response from orders API');
      }
      const data = await res.json();
      if (data && data.order) {
        setCompletedOrder(data.order);
        setCart([]);
        setShowCheckoutModal(false);
      }
    } catch (err) {
      console.error('Error placing order', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Categories list
  const categories: (ProductCategory | 'My Listed Items')[] = [
    'All',
    'My Listed Items',
    'Textbooks & Books',
    'Electronics & Gadgets',
    'Fashion & Clothing',
    'Food & Snacks',
    'Hostel Essentials',
    'Services & Printing',
  ];

  // Filter products
  const isClothingDepartment = selectedCategory === 'Fashion & Clothing';

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'My Listed Items') {
      const isMine = p.sellerId === user?.id || p.sellerName === user?.name;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return isMine && matchesSearch;
    }

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesCategory || !matchesSearch) return false;

    // Apply clothing size & colour filters
    if (isClothingDepartment) {
      if (selectedSizes.length > 0) {
        if (!p.sizes || !p.sizes.some((s) => selectedSizes.includes(s as ClothingSize))) {
          return false;
        }
      }
      if (selectedColor) {
        if (!p.colors || !p.colors.includes(selectedColor)) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="relative min-h-screen z-10 flex flex-col px-4 py-6 text-slate-800 max-w-7xl mx-auto">
      {/* Top Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-4 bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white/90 border border-red-200/80 p-4 rounded-3xl backdrop-blur-md shadow-lg shadow-red-100/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            id="back-to-dashboard-from-shop"
            className="p-2 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-[#CE1126] rounded-full transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#CE1126]" />
              Central Marketplace
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Post, Edit, and Buy items with custom photos across Central University Miotso Campus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sell Button - Only visible for verified Merchants */}
          {user?.role === 'merchant' ? (
            <button
              onClick={() => {
                setImagePreview('');
                setImage('');
                setShowSellModal(true);
              }}
              id="open-sell-modal-button"
              className="flex items-center gap-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-full shadow-md shadow-red-200 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Item to Sell</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Buying Mode (Merchant Only to Sell)</span>
            </div>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setShowCartDrawer(true)}
            id="open-cart-drawer-button"
            className="relative flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs md:text-sm px-4 py-2.5 rounded-full transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#CE1126]" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#CE1126] text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Open Market Hero Banner - Only visible for verified Merchants */}
      {user?.role === 'merchant' && (
        <div className="mb-6 p-5 md:p-6 bg-gradient-to-r from-red-50 via-white to-orange-50 border-2 border-red-200/80 rounded-3xl shadow-md text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 bg-[#CE1126] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>Open Campus Marketplace</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
              Verified Merchant Storefront
            </h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              List textbooks, electronics, dorm essentials, fashion, or food in seconds with live photo uploads and direct WhatsApp / MoMo checkout!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                setImagePreview('');
                setImage('');
                setShowSellModal(true);
              }}
              id="banner-sell-button"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-full shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Sell Your Item Now (Free)</span>
            </button>
            <button
              onClick={() => setSelectedCategory('My Listed Items')}
              id="banner-my-listings-button"
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-4 py-3 rounded-full transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#CE1126]" />
              <span>My Listings</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="space-y-4 mb-8">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#CE1126]" />
          <input
            type="text"
            placeholder="Search textbooks, laptops, hoodies, Jollof rice, hostel fridges, sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-white border border-red-100 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] shadow-sm shadow-red-100/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#CE1126] border-[#CE1126] text-white shadow-md shadow-red-200'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#CE1126] hover:text-[#CE1126]'
              }`}
            >
              {cat === 'My Listed Items' ? `🏷️ My Listed Items` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clothing Department Mobile Filter Bar */}
      {isClothingDepartment && (
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilter((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs font-bold text-slate-800 cursor-pointer hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#CE1126]" />
              <span className="uppercase tracking-wider font-extrabold">FILTERS (Size & Colour)</span>
              {(selectedSizes.length > 0 || selectedColor) && (
                <span className="px-2 py-0.5 rounded-full bg-[#CE1126] text-white text-[10px] font-black">
                  {selectedSizes.length + (selectedColor ? 1 : 0)} Active
                </span>
              )}
            </div>
            <span className="text-slate-500 font-semibold text-xs">
              {showMobileFilter ? 'Hide Filters ▲' : 'Open Filters ▼'}
            </span>
          </button>

          {showMobileFilter && (
            <div className="mt-3">
              <ClothingFilterPanel
                selectedSizes={selectedSizes}
                selectedColor={selectedColor}
                onToggleSize={(size) => {
                  setSelectedSizes((prev) =>
                    prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                  );
                }}
                onSelectColor={(color) => {
                  setSelectedColor((prev) => (prev === color ? null : color));
                }}
                onClearFilters={() => {
                  setSelectedSizes([]);
                  setSelectedColor(null);
                }}
                totalFilteredCount={filteredProducts.length}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setShowMobileFilter(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Content Layout (Sidebar + Products Grid when in Clothing department) */}
      <div className={isClothingDepartment ? "flex flex-col lg:flex-row gap-6 lg:gap-8 items-start" : ""}>
        {/* Desktop Sticky Filters Sidebar matching user screenshot */}
        {isClothingDepartment && (
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24 self-start">
            <ClothingFilterPanel
              selectedSizes={selectedSizes}
              selectedColor={selectedColor}
              onToggleSize={(size) => {
                setSelectedSizes((prev) =>
                  prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
                );
              }}
              onSelectColor={(color) => {
                setSelectedColor((prev) => (prev === color ? null : color));
              }}
              onClearFilters={() => {
                setSelectedSizes([]);
                setSelectedColor(null);
              }}
              totalFilteredCount={filteredProducts.length}
            />
          </aside>
        )}

        {/* Products Column */}
        <div className={isClothingDepartment ? "flex-1 min-w-0 w-full" : "w-full"}>
          {/* Active Filter Badges Bar */}
          {isClothingDepartment && (selectedSizes.length > 0 || selectedColor) && (
            <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <span className="text-xs font-bold text-slate-500">Active filters:</span>
              {selectedSizes.map((sz) => (
                <span
                  key={sz}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold"
                >
                  Size: {sz}
                  <button
                    onClick={() => setSelectedSizes((prev) => prev.filter((s) => s !== sz))}
                    className="hover:text-red-300 ml-1 cursor-pointer font-black"
                    aria-label={`Remove size ${sz}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {selectedColor && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-bold capitalize">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-white/50"
                    style={{
                      backgroundColor: CLOTHING_COLORS.find((c) => c.key === selectedColor)?.hex,
                    }}
                  />
                  Colour: {selectedColor}
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="hover:text-red-300 ml-1 cursor-pointer font-black"
                    aria-label={`Remove color ${selectedColor}`}
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedColor(null);
                }}
                className="text-xs text-[#CE1126] font-bold hover:underline ml-auto cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Products Grid / Loading / Empty State */}
          {loading ? (
            <CartPushLoadingSVG 
              message="Loading Miotso Marketplace items..." 
              subMessage="Synchronizing live student stalls & items" 
            />
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center py-10 bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
              <CartPushLoadingSVG 
                message={
                  isClothingDepartment && (selectedSizes.length > 0 || selectedColor)
                    ? 'No clothing styles match your active filters'
                    : selectedCategory === 'My Listed Items'
                    ? 'You have no listed items yet'
                    : 'No products found'
                } 
                subMessage={
                  isClothingDepartment && (selectedSizes.length > 0 || selectedColor)
                    ? 'Try clearing a size or selecting another colour swatch to view more styles.'
                    : selectedCategory === 'My Listed Items' 
                    ? 'Click "List Item to Sell" above to insert your own photo and publish your product!' 
                    : 'Be the first to list an item with your own picture on Central Mall!'
                } 
              />
              {isClothingDepartment && (selectedSizes.length > 0 || selectedColor) ? (
                <button
                  onClick={() => {
                    setSelectedSizes([]);
                    setSelectedColor(null);
                  }}
                  className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSellModal(true)}
                  className="mt-4 px-6 py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-full shadow-md shadow-red-200 cursor-pointer flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post Item with Picture Now
                </button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isClothingDepartment ? 'xl:grid-cols-3' : 'lg:grid-cols-3'} gap-6`}>
              {filteredProducts.map((product) => {
                const isUserOwner = product.sellerId === user?.id || product.sellerName === user?.name;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-white border border-gray-100 hover:border-red-200 rounded-3xl overflow-hidden shadow-xl shadow-gray-100/80 hover:shadow-2xl hover:shadow-red-100 transition-all hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image & Picture Badges */}
                      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />

                        {/* Price Tag */}
                        <div className="absolute top-3 left-3 bg-[#CE1126] text-white font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1 z-10">
                          <span>GHS {product.price}</span>
                          {usdRate && (
                            <span className="text-[10px] font-normal text-amber-200">
                              (~${(product.price * usdRate).toFixed(2)})
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete Action Buttons directly on image */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(product);
                            }}
                            id={`edit-product-${product.id}`}
                            className="bg-white/95 hover:bg-[#CE1126] text-slate-800 hover:text-white p-1.5 rounded-full shadow-md backdrop-blur-sm border border-slate-200 hover:border-[#CE1126] transition-colors cursor-pointer flex items-center gap-1 px-2.5 text-[11px] font-bold"
                            title="Edit this item (Picture, Price, Details)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                            <span>Edit</span>
                          </button>

                          {isUserOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id);
                              }}
                              className="bg-white/95 hover:bg-red-600 text-red-600 hover:text-white p-1.5 rounded-full shadow-md backdrop-blur-sm border border-red-200 transition-colors cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Condition Badge Bottom Right of Image */}
                        <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                          {product.condition}
                        </div>
                      </div>

                      {/* Info Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#CE1126]">
                            <Tag className="w-3 h-3" />
                            <span>{product.category}</span>
                          </div>
                          {product.datePosted && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {product.datePosted}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#CE1126] transition-colors">
                          {product.title}
                        </h3>

                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-3 leading-relaxed">
                          {product.description}
                        </p>

                        {/* Available Sizes & Interactive Colour Swatches */}
                        {(product.sizes || product.colors) && (
                          <div className="py-2.5 px-3 bg-slate-50 rounded-xl mb-3 border border-slate-100 space-y-2">
                            {product.sizes && product.sizes.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                                  Size:
                                </span>
                                {product.sizes.map((sz) => {
                                  const isChecked = selectedSizes.includes(sz as ClothingSize);
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSizes((prev) =>
                                          prev.includes(sz as ClothingSize)
                                            ? prev.filter((s) => s !== sz)
                                            : [...prev, sz as ClothingSize]
                                        );
                                      }}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                        isChecked
                                          ? 'bg-slate-900 text-white shadow-sm'
                                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-400'
                                      }`}
                                      title={`Filter by size ${sz}`}
                                    >
                                      {sz}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {product.colors && product.colors.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                                  Colour:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {product.colors.map((cKey) => {
                                    const opt = CLOTHING_COLORS.find((c) => c.key === cKey);
                                    if (!opt) return null;
                                    const isSelected = selectedColor === cKey;
                                    return (
                                      <button
                                        key={cKey}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedColor((prev) =>
                                            prev === cKey ? null : (cKey as ClothingColorKey)
                                          );
                                        }}
                                        className={`w-4 h-4 rounded-full transition-all cursor-pointer ${
                                          opt.borderClass || ''
                                        } ${
                                          isSelected
                                            ? 'ring-2 ring-offset-1 ring-slate-900 scale-125'
                                            : 'hover:scale-125'
                                        }`}
                                        style={{ backgroundColor: opt.hex }}
                                        title={`Filter styles by ${opt.label} swatch`}
                                        aria-label={`Select ${opt.label} colour swatch`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#CE1126]" />
                              <span className="font-bold text-slate-800">{product.sellerName}</span>
                            </div>
                            <span className="text-[10px] bg-red-50 text-[#CE1126] font-bold px-2 py-0.5 rounded-full border border-red-100">
                              {product.sellerRole}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#CE1126]" />
                            <span>{product.locationOnCampus}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-[#CE1126]" />
                            <a 
                              href={`https://wa.me/${product.sellerContact?.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="hover:text-emerald-600 underline font-mono"
                            >
                              {product.sellerContact}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        id={`btn-edit-item-${product.id}`}
                        className="py-2 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-800 hover:text-[#CE1126] font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Item</span>
                      </button>

                      <button
                        onClick={() => addToCart(product)}
                        id={`add-to-cart-${product.id}`}
                        className="py-2 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-full shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: LIST ITEM TO SELL (WITH PICTURE INSERTION) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showSellModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-red-100 w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800"
            >
              <button
                onClick={() => setShowSellModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5 text-left">
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-xs font-bold text-[#CE1126] mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#CE1126]" />
                  <span>Open to All Students, Hostelites & Merchants</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">List Your Item to Sell</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Anyone on campus can post items for sale. Add your photo, set your price, and connect with buyers directly via WhatsApp & MoMo.
                </p>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-left">
                {/* 1. SELLER IDENTITY (ANYONE CAN SELL) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <label className="block text-xs font-extrabold text-slate-800 mb-2">
                    Selling As / Identity
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { role: 'Student', label: '🎓 Student Seller' },
                      { role: 'Campus Merchant', label: '🏪 Campus Merchant' },
                      { role: 'Hostel Resident', label: '🏠 Hostel Resident' },
                      { role: 'Faculty / Staff', label: '🏢 Faculty / Staff' },
                      { role: 'Visitor / Alum', label: '🌟 Alum / Guest' },
                    ].map((item) => (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => setSellerRole(item.role as any)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                          sellerRole === item.role
                            ? 'bg-[#CE1126] text-white border-[#CE1126] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. PICTURE INSERTION ZONE */}
                <div className="p-4 bg-slate-50 border-2 border-dashed border-red-200 rounded-2xl">
                  <label className="block text-xs font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#CE1126]" />
                    <span>Upload / Insert Item Picture (Reflects Instantly)</span>
                  </label>

                  {/* Active Preview */}
                  {imagePreview || image ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-200 mb-3 border border-slate-300">
                      <img
                        src={imagePreview || image}
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-emerald-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Picture Ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImage('');
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md cursor-pointer"
                        title="Remove Picture"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                  {/* Upload Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Choose Photo From Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder="Or paste image URL"
                        value={image}
                        onChange={(e) => {
                          setImage(e.target.value);
                          setImagePreview(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CE1126]"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Photos */}
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Or choose sample photo:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {samplePresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setImage(preset.url);
                            setImagePreview(preset.url);
                          }}
                          className="text-[10px] bg-white hover:bg-red-50 text-slate-700 border border-slate-200 hover:border-red-300 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. TITLE & CATEGORY */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Constitutional Law Textbook / HP Laptop / Central Hoodie"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price (GHS)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 120"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    >
                      {categories.filter((c) => c !== 'All' && c !== 'My Listed Items').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Fair">Fair / Gently Used</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Campus Meetup / Location
                    </label>
                    <select
                      value={locationOnCampus}
                      onChange={(e) => setLocationOnCampus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    >
                      <option value="Trinity Hall Porter Desk">Trinity Hall Porter Desk</option>
                      <option value="Destiny Hall Courtyard">Destiny Hall Courtyard</option>
                      <option value="Chancellor Hall Lobby">Chancellor Hall Lobby</option>
                      <option value="Central Square / Food Court">Central Square / Food Court</option>
                      <option value="Main Library Forecourt">Main Library Forecourt</option>
                      <option value="Senate Building Area">Senate Building Area</option>
                      <option value="Central Clinic Reception">Central Clinic Reception</option>
                      <option value="Off-Campus Dawhenya / Prampram Gate">Off-Campus Dawhenya / Prampram Gate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seller / Shop Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jesse / Kwame / Campus Mart"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+233 24 123 4567"
                      value={sellerContact}
                      onChange={(e) => setSellerContact(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description & Specifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your item in detail, specifications, key features, reasons for selling..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProduct}
                  id="submit-product-listing-button"
                  className="w-full py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold rounded-full shadow-lg shadow-red-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingProduct ? (
                    <span>Publishing Item to Central Mall...</span>
                  ) : (
                    <span>Publish Item to Marketplace (Instant Live)</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT EXISTING ITEM (ENABLES USER TO EDIT ITEMS) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-red-100 w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-800"
            >
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-5 text-left">
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-700 mb-2">
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Edit Item Listing</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Update Item & Picture</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Change picture, title, price, or description anytime.
                </p>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4 text-left">
                {/* PICTURE UPDATE ZONE */}
                <div className="p-4 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl">
                  <label className="block text-xs font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Update / Replace Item Picture</span>
                  </label>

                  {/* Active Preview */}
                  {editImagePreview || editImage ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-200 mb-3 border border-slate-300">
                      <img
                        src={editImagePreview || editImage}
                        alt="Product Edit Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active Picture</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Upload New Picture */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-sm transition-all">
                      <Upload className="w-4 h-4" />
                      <span>Upload New Picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      placeholder="Or update image URL"
                      value={editImage}
                      onChange={(e) => {
                        setEditImage(e.target.value);
                        setEditImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CE1126]"
                    />
                  </div>
                </div>

                {/* EDIT TITLE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price (GHS)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    >
                      {categories.filter((c) => c !== 'All' && c !== 'My Listed Items').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Campus Location
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingEdit}
                    id="save-edit-product-button"
                    className="flex-1 py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold rounded-full shadow-lg shadow-red-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingEdit ? 'Saving Changes...' : 'Save & Update Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* DRAWER: SHOPPING CART */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showCartDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white border-l border-red-100 w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto text-slate-800"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#CE1126]" />
                    <h2 className="text-xl font-black text-slate-900">Your Order Cart</h2>
                  </div>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">Your cart is currently empty.</p>
                    <p className="text-xs text-slate-400 mt-1">Add items from the marketplace above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-xl bg-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.title}
                          </h4>
                          <p className="text-xs font-extrabold text-[#CE1126] mt-0.5">
                            GHS {item.product.price}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-slate-900 px-2">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-[#CE1126] p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-xl font-black text-[#CE1126]">GHS {cartTotal.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowCartDrawer(false);
                      setShowCheckoutModal(true);
                    }}
                    id="proceed-to-checkout-button"
                    className="w-full py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold rounded-full shadow-lg shadow-red-200 cursor-pointer"
                  >
                    Proceed to Payment & Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 3: CHECKOUT & PAYMENT */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showCheckoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-red-100 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative text-slate-800"
            >
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-left">
                <h2 className="text-2xl font-black text-slate-900">Order Payment Checkout</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Total Payable: <span className="font-extrabold text-[#CE1126]">GHS {cartTotal.toFixed(2)}</span>
                </p>
              </div>

              <form onSubmit={handleProcessOrder} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'momo'
                          ? 'bg-amber-400 border-amber-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-400'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-[11px]">MTN MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('telecel')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'telecel'
                          ? 'bg-[#CE1126] border-[#CE1126] text-white font-black shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-[#CE1126]'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-[11px]">Telecel Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'bg-slate-900 border-slate-900 text-white font-black shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-800'
                      }`}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="text-[11px]">Pay on Pickup</span>
                    </button>
                  </div>
                </div>

                {paymentMethod !== 'cod' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Money Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+233 24 000 0000"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campus Delivery / Pickup Point
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trinity Hall Room B12 / Destiny Hall Porter Desk"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#CE1126] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processingPayment}
                  id="confirm-pay-order-button"
                  className="w-full py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold rounded-full shadow-lg shadow-red-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment & Dispatch...</span>
                    </span>
                  ) : (
                    <span>Confirm Order (GHS {cartTotal.toFixed(2)})</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* ORDER COMPLETED SUCCESS MODAL */}
      {/* ======================================================== */}
      <AnimatePresence>
        {completedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-emerald-200 w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl text-center text-slate-800"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Order Confirmed!</h2>
              <p className="text-xs text-slate-500 font-medium mb-4">
                Order ID: <span className="font-mono font-bold text-slate-800">{completedOrder.id}</span>
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-2 text-xs mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Location:</span>
                  <span className="font-bold text-slate-800">{completedOrder.deliveryLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span className="font-bold text-[#CE1126]">{completedOrder.paymentMethod.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Paid:</span>
                  <span className="font-extrabold text-emerald-600">GHS {completedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <button
                onClick={() => setCompletedOrder(null)}
                id="close-order-success-modal"
                className="w-full py-3 bg-[#CE1126] hover:bg-[#A00D1D] text-white font-extrabold text-xs rounded-full shadow-md shadow-red-200 cursor-pointer"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
