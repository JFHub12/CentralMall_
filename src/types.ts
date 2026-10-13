export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  role: 'student' | 'merchant' | 'visitor' | 'staff';
  phone?: string;
  avatar?: string;
}

export type ProductCategory =
  | 'All'
  | 'Textbooks & Books'
  | 'Electronics & Gadgets'
  | 'Fashion & Clothing'
  | 'Food & Snacks'
  | 'Hostel Essentials'
  | 'Services & Printing';

export interface Product {
  id: string;
  title: string;
  price: number; // In GHS (Ghana Cedis)
  description: string;
  category: ProductCategory;
  image: string;
  sellerName: string;
  sellerContact: string;
  sellerRole: string;
  sellerId?: string;
  locationOnCampus: string;
  dateAdded?: string;
  datePosted?: string;
  condition: 'Brand New' | 'Like New' | 'Fair';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'momo' | 'telecel' | 'at_money' | 'card' | 'cod';

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  momoNumber?: string;
  deliveryLocation: string;
  status: 'Completed' | 'Processing';
  createdAt: string;
}

export type BuildingCategory =
  | 'All'
  | 'Academic'
  | 'Hostels'
  | 'Administrative'
  | 'Medical'
  | 'Amenities'
  | 'Sports';

export interface CampusNotification {
  id: string;
  title: string;
  message: string;
  category: 'market' | 'clinic' | 'gps' | 'general';
  timestamp: string;
  timeAgo: string;
  read: boolean;
  actionUrl?: 'shop' | 'gps' | 'clinic';
  actionLabel?: string;
  icon?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  category: 'market' | 'clinic' | 'gps' | 'general';
  actionUrl?: 'shop' | 'gps' | 'clinic';
  actionLabel?: string;
  duration?: number;
}

export interface Building {
  id: string;
  name: string;
  category: BuildingCategory;
  code: string;
  description: string;
  x: number; // Map percentage coordinate X (0-100)
  y: number; // Map percentage coordinate Y (0-100)
  lat?: number; // Real GPS Latitude on Miotso campus
  lng?: number; // Real GPS Longitude on Miotso campus
  image: string;
  openingHours: string;
  facilities: string[];
}

export interface RouteGuidanceStep {
  instruction: string;
  laneName: string;
  distanceMeters: number;
  directionIcon?: string;
}

export interface CampusRouteResult {
  distanceMeters: number;
  walkMinutes: number;
  steps: string[];
  guidanceSteps?: RouteGuidanceStep[];
  coordinates: [number, number][]; // [lat, lng] array along campus roads and lanes
  primaryRoad: string;
  roadSurface: string;
  openRouterOptimized?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'clinic_nurse';
  text: string;
  timestamp: string;
  quickActions?: string[];
}

export type ConsultationType = 'virtual_video' | 'virtual_voice' | 'in_person';

export interface ClinicAppointment {
  id: string;
  studentName: string;
  studentId: string;
  doctorName?: string;
  specialistRole?: string;
  consultationType?: ConsultationType;
  date: string;
  time: string;
  timeSlot?: string;
  reason: string;
  symptoms?: string[];
  nhisNumber?: string;
  virtualLink?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt?: string;
}

export interface LiveGPSUser {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  speedKmH: number;
  headingDeg: number;
  lastUpdated: string;
  isSelf?: boolean;
}

export interface CampusNotice {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Academic' | 'Admissions' | 'SRC' | 'Clinic & Health' | 'Administration' | 'Events' | 'Finance';
  date: string;
  officialLink: string;
  priority: 'urgent' | 'important' | 'normal';
  source: string;
  targetAudience: string;
  isNew?: boolean;
}

export interface GHSHealthTip {
  id: string;
  title: string;
  category: 'Malaria' | 'Hydration' | 'Nutrition' | 'Mental Health' | 'Hygiene' | 'Pharmacy' | 'Eye Care';
  categoryBadge: string;
  summary: string;
  fullTip: string;
  actionPoints: string[];
  ghsSourceUrl: string;
  ghsDivision: string;
  date: string;
  readTime: string;
  imageUrl: string;
  iconType: string;
  isDailyFeatured?: boolean;
}

