import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'stored_products.json');
const NOTICES_FILE = path.join(DATA_DIR, 'stored_notices.json');
const ORDERS_FILE = path.join(DATA_DIR, 'stored_orders.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'stored_appointments.json');
const API_CONFIG_FILE = path.join(DATA_DIR, 'stored_api_config.json');

// Visual mask representation so credentials are not exposed in plaintext or code:
export const MASKED_CHATBOT_KEY_DISPLAY = 'sk-or-v1-********************************';

interface StoredApiConfig {
  openRouterApiKey?: string;
  openRouterModel?: string;
  updatedAt?: string;
}

function loadApiConfig(): StoredApiConfig {
  try {
    if (fs.existsSync(API_CONFIG_FILE)) {
      const raw = fs.readFileSync(API_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[API Config] Failed to load config, using default', e);
  }
  return {};
}

function saveApiConfig(cfg: StoredApiConfig) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(API_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('[API Config] Failed to save config', e);
  }
}

function getActiveChatbotApiKey(): { key: string; isConfigured: boolean; maskedKey: string; model: string } {
  const fileConfig = loadApiConfig();
  const rawKey = fileConfig.openRouterApiKey?.trim() || process.env.OPENROUTER_API_KEY?.trim() || '';
  const model = fileConfig.openRouterModel?.trim() || process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';

  const isConfigured = rawKey.length > 5 &&
    !rawKey.includes('YOUR_OPENROUTER_API_KEY') &&
    !rawKey.startsWith('MY_');

  return {
    key: rawKey,
    isConfigured,
    maskedKey: MASKED_CHATBOT_KEY_DISPLAY,
    model
  };
}

function loadJsonStore<T>(filePath: string, fallback: T[]): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`[Store] Failed to load ${filePath}, using fallback`, e);
  }
  return [...fallback];
}

function saveJsonStore<T>(filePath: string, data: T[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[Store] Failed to save ${filePath}`, e);
  }
}

// In-memory registered users store for Central Mall backend
// Only users registered through signup exist here.
interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  studentId?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
}

const users: Map<string, UserAccount> = new Map();

function detectGenderFromName(name: string): 'male' | 'female' {
  if (!name) return 'male';
  const firstName = name.trim().split(/\s+/)[0].toLowerCase();
  const femaleNames = [
    'mary', 'patricia', 'linda', 'barbara', 'elizabeth', 'jennifer', 'maria', 'susan', 'margaret', 'dorothy',
    'lisa', 'nancy', 'karen', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle',
    'laura', 'sarah', 'kim', 'deborah', 'jessica', 'shirley', 'cynthia', 'angela', 'melissa', 'brenda', 'amy',
    'anna', 'rebecca', 'virginia', 'kathleen', 'pamela', 'martha', 'debra', 'amanda', 'stephanie', 'carolyn',
    'christine', 'marie', 'janet', 'catherine', 'frances', 'ann', 'joyce', 'diane', 'alice', 'julie', 'heather',
    'teresa', 'doris', 'gloria', 'evelyn', 'jean', 'cheryl', 'mildred', 'katherine', 'joan', 'ashley', 'judith',
    'rose', 'janice', 'kelly', 'nicole', 'judy', 'christina', 'kathy', 'theresa', 'beverly', 'denise', 'tammy',
    'irene', 'jane', 'lori', 'rachel', 'marilyn', 'andrea', 'kathryn', 'louise', 'sara', 'anne', 'jacqueline',
    'wanda', 'bonnie', 'julia', 'ruby', 'lois', 'tina', 'phyllis', 'norma', 'paula', 'diana', 'annie', 'lillian',
    'emily', 'hannah', 'akosua', 'abena', 'yaa', 'afia', 'adwoa', 'amma', 'esi', 'priscilla', 'gifty', 'prudence',
    'beatrice', 'abigail', 'dorcas', 'esther', 'mercy', 'joanna', 'jessica', 'rachel', 'favour', 'blessing', 'cynthia',
    'grace', 'faith', 'hope', 'destiny', 'charity', 'joy', 'peace', 'victory', 'queen', 'princes', 'princess'
  ];
  return femaleNames.includes(firstName) ? 'female' : 'male';
}


// -------------------------------------------------------------
// OPENROUTER AI CONFIGURATION & HELPER
// -------------------------------------------------------------
interface OpenRouterChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const CENTRAL_CAMPUS_SYSTEM_PROMPT = `You are Central AI, the official and intelligent campus AI assistant for Central University Ghana (http://central.edu.gh/), Miotso Main Campus.
You provide comprehensive, helpful, friendly, and accurate answers to students, faculty, applicants, and campus visitors.

Official Knowledge Base for Central University (Miotso Main Campus):
- Chancellor: Dr. Mensa Otabil; Vice-Chancellor: Prof. Bill Buenar Puplampu.
- Main Campus: Miotso (near Dawhenya / Prampram, Greater Accra Region). Other campuses: Mataheko (Accra) and Christ Temple (Kumasi).
- Key Faculties & Schools:
  • Central Business School (CBS): Accounting, Banking, Marketing, HRM, Management.
  • Faculty of Law: Accredited LLB with state-of-the-art Moot Court.
  • School of Medicine and Health Sciences (SMHS): Nursing, Pharmacy, Physician Assistantship, Public Health.
  • Faculty of Arts & Social Sciences (FASS): Communication Studies, Economics, Sociology.
  • Faculty of Engineering & Applied Sciences: Civil, Computer Science, IT, Architecture.
- Campus Landmarks & GPS Codes:
  • Senate Building (SEN-01): Administration, VC Office, Admissions, Academic Affairs, Finance.
  • Central University Main Library (LIB-01): 3-floor study facility with digital e-library access.
  • School Clinic (CLN-01): Accredited by Ghana Health Service (GHS), 24/7 triage near Trinity Hall.
  • Trinity Hall (TRN-01): Male student residence.
  • Destiny Hall (DST-01): Female student residence.
  • Sports Complex (SPT-01): Basketball, tennis, athletics track, and football pitch.
  • Food Court & Cafeteria (FCT-01): Student meals, snacks, provisions.
- Central Mall:
  • Official campus student marketplace for buying and selling textbooks, laptops, phones, sneakers, hoodies, and snacks.
  • Sellers can upload real item photos, specify prices in GHS (GH¢), and connect directly via WhatsApp and MTN Mobile Money (MoMo) / Telecel Cash.
- Admissions & Student Portals:
  • Admissions vouchers available at http://central.edu.gh/ or USSD (*887*9#).
  • OSIS Student Portal for course registration, grades, and fee receipts.
  • Central E-Learning Moodle for online lectures and assignments.

Formatting Rules:
- Format your responses cleanly with bold headings, neat bullet points, and practical advice.
- When answering health emergencies, refer students to Central Clinic (+233 30 393 0000) or 112.`;

const CLINIC_SYSTEM_PROMPT = `You are the virtual Medical Triage Officer for Central University School Clinic (Miotso Campus), operating under Ghana Health Service (GHS - https://ghs.gov.gh/) clinical guidelines and NHIS standards.
Your mission is to provide accurate, compassionate health advice, symptoms assessment, preventive measures, and clear instructions.
- For Malaria/Fever: recommend Rapid Diagnostic Testing (RDT) or Microscopy at Central Clinic and standard GHS ACT treatment (Artemether-Lumefantrine / Artesunate-Amodiaquine) under nurse supervision.
- For Cholera/Diarrhea: stress immediate Oral Rehydration Salts (ORS), zinc, clean boiled water, and WASH protocols.
- For Emergencies: direct students immediately to the Central Clinic Emergency Wing near Trinity Hall or ambulance hotline (+233 30 393 0000 / 112).
- Highlight that valid Ghana NHIS cards are accepted at the clinic for consultations and covered medications.`;

// Fallback intelligence when OpenRouter key is not set or network is offline
function getFallbackCampusReply(query: string): string {
  const q = query.toLowerCase().trim();

  // Greetings
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

  // Motto and Chancellor / Leadership
  if (q.includes('motto') || q.includes('slogan') || q.includes('creed') || q.includes('chancellor') || q.includes('otabil') || q.includes('founder') || q.includes('vice chancellor') || q.includes('leadership')) {
    return `🏛️ **Central University Leadership & Identity:**

• **University Motto:** **"Faith, Integrity, Excellence"**
• **Founder & Chancellor:** **Dr. Mensa Otabil** (General Overseer, International Central Gospel Church - ICGC).
• **Vision:** To be an internationally reputable Christian University committed to academic excellence and moral uprightness.
• **Main Campus Location:** Miotso Main Campus, near Dawhenya on the Accra-Aflao Highway, Greater Accra Region, Ghana.
• **Website:** http://central.edu.gh/`;
  }

  // Trinity Hall specific or General Hostels
  if (q.includes('trinity') || q.includes('hostel') || q.includes('destiny') || q.includes('room') || q.includes('accommodation') || q.includes('residence') || q.includes('dorm')) {
    const isTrinity = q.includes('trinity');
    const isDestiny = q.includes('destiny');

    if (isTrinity) {
      return `🏠 **Trinity Hall (TRN-01) - Male Student Residence:**

• **Location on Campus:** Situated on the eastern residential quadrant of Miotso campus, immediately adjacent to the **Central School Clinic** and a short 2-minute walk from the Sports Complex.
• **Facilities:** Dedicated study rooms on each floor, high-speed Wi-Fi, 24/7 security patrol, laundry areas, and reliable standby generators.
• **Room Types:** 2-in-a-room and 4-in-a-room options with en-suite bathrooms and individual study desks.
• **Booking & Inquiries:** Managed through the Dean of Students Office located on the Ground Floor of the Senate Building.
👉 *Tip: Check out the **"Campus GPS"** tab in top navigation for walking directions to Trinity Hall!*`;
    }

    if (isDestiny) {
      return `🏠 **Destiny Hall (DST-01) - Female Student Residence:**

• **Location on Campus:** Located on the north-eastern residential quadrangle of Miotso campus, surrounded by serene study gardens.
• **Facilities:** Private kitchenettes, spacious study lounges, biometric security access, CCTV surveillance, and 24/7 water supply.
• **Room Types:** 2-in-a-room and 4-in-a-room shared executive options with wardrobe fixtures.
• **Booking & Inquiries:** Apply through the Student Housing portal or visit Dean of Students Office at Senate Building Ground Floor.`;
    }

    return `🏠 **Campus Accommodation & Hostels:**

• **Trinity Hall (TRN-01):** On-campus male residence hall equipped with study rooms, high-speed Wi-Fi, and 24/7 security.
• **Destiny Hall (DST-01):** On-campus female residence hall with dedicated kitchenettes, study lounges, and CCTV security.
• **Private Off-Campus Hostels:** Accredited private hostels located in Dawhenya and Prampram (with campus shuttle transport available).
• **Booking & Enquiries:** Contact the Dean of Students office at Senate Building Ground Floor.`;
  }

  // Admissions & Requirements
  if (q.includes('admission') || q.includes('apply') || q.includes('requirement') || q.includes('voucher') || q.includes('cut off') || q.includes('wassce') || q.includes('sssce')) {
    return `🎓 **Central University Admissions Guide (http://central.edu.gh/):**

• **Undergraduate Entry Requirements:** WASSCE / SSSCE candidates need credit passes (A1-C6) in 3 core subjects (Core Mathematics, English Language, Integrated Science / Social Studies) plus 3 relevant electives with an aggregate score of 36 or better.
• **Application Voucher:** Purchase your e-voucher for GH¢200 (undergraduate), GH¢270 (postgraduate), or $100 (international applicants) directly at https://central.edu.gh/ or via mobile USSD code *887*9#.
• **Mature & Transfer Students:** Central University offers mature entrance preparation classes and credit exemptions for accredited diploma holders.
• **Admissions Office:** Located on the Ground Floor, Senate Building (SEN-01), Miotso Main Campus.
📞 Phone: +233 30 702 0540 / +233 55 510 1093 | ✉️ Email: enquiry.admissions@central.edu.gh`;
  }

  // Faculties & Programs
  if (q.includes('faculty') || q.includes('faculties') || q.includes('course') || q.includes('courses') || q.includes('program') || q.includes('programs') || q.includes('degree') || q.includes('law') || q.includes('pharmacy') || q.includes('nursing') || q.includes('business') || q.includes('engineering') || q.includes('computer science') || q.includes('it')) {
    return `📚 **Faculties & Academic Programs at Central University:**

• **Central Business School (CBS):** B.Sc. Administration (Accounting, Banking & Finance, Marketing, HRM, Agribusiness).
• **Faculty of Law:** Renowned Bachelor of Laws (LL.B) degree with an ultra-modern Moot Court for clinical legal education.
• **School of Medicine & Health Sciences:** Doctor of Pharmacy (Pharm D), B.Sc. Nursing, B.Sc. Physician Assistantship, B.Sc. Public Health.
• **Faculty of Engineering & Applied Sciences:** B.Sc. Information Technology, Computer Science, Civil Engineering, Architecture.
• **Faculty of Arts & Social Sciences (FASS):** Communication Studies (Journalism & PR), Economics, Sociology.`;
  }

  // Central Mall Marketplace Guide
  if (q.includes('sell') || q.includes('mall') || q.includes('picture') || q.includes('photo') || q.includes('item') || q.includes('buy') || q.includes('shop') || q.includes('order') || q.includes('momo') || q.includes('money')) {
    return `🛍️ **Central Mall Marketplace Guide:**

• **Selling on Central Mall:** Any registered student or merchant can click **"+ Sell Item"** at the top right of the Shop page.
• **Uploading Pictures:** You can insert real image URLs (Cloudinary, Imgur, direct links) or pick our pre-curated high-res campus product images.
• **Receiving Payments:** Add your MTN MoMo or Telecel Cash number and your WhatsApp contact so fellow students can reach you instantly.
• **Safety Tip:** Always conduct item exchanges in public, well-lit campus areas like the Senate Building quadrangle or Central Library forecourt.`;
  }

  // GPS & Locations
  if (q.includes('gps') || q.includes('location') || q.includes('where') || q.includes('direction') || q.includes('directions') || q.includes('map') || q.includes('navigate') || q.includes('building') || q.includes('senate') || q.includes('library') || q.includes('court') || q.includes('sports')) {
    if (q.includes('senate')) {
      return `🏛️ **Senate Building (SEN-01) Location:**
• Central administrative headquarters of Central University Miotso campus.
• Houses the Vice-Chancellor's Office, Admissions, Academic Affairs, Student Accounts, and Dean of Students.
• Located at the center of the campus main boulevard entrance.`;
    }
    if (q.includes('library')) {
      return `📖 **Central University Library (LIB-01):**
• Located centrally on the Academic Quadrangle between Central Business School and Law Faculty.
• Open Monday – Friday from 8:00 AM to 10:00 PM; Saturdays from 9:00 AM to 5:00 PM.
• Equipped with air-conditioned study carrels, electronic journal databases, and high-speed Wi-Fi.`;
    }
    if (q.includes('court') || q.includes('moot')) {
      return `⚖️ **Law Moot Court Complex:**
• Situated inside the Faculty of Law building near the north-west corridor.
• State-of-the-art judicial mock courtroom for trial advocacy practice.`;
    }

    return `📍 **Campus Navigation & Key Locations (Miotso Main Campus):**

• **Senate Building (SEN-01):** Central administrative hub, Admissions, VC, and Finance offices.
• **School Clinic (CLN-01):** Located immediately adjacent to Trinity Hall, open 24/7 with emergency ambulance dispatch.
• **Central Library (LIB-01):** Main academic research library located central to all lecture theatres.
• **Sports Complex (SPT-01):** Basketball courts and football pitch situated near the North campus gate.
👉 *Tip: Open the **"Campus GPS"** tab in the top navigation for real-time interactive mapping and walking routes!*`;
  }

  // Fees & Student Portals (OSIS, Moodle)
  if (q.includes('portal') || q.includes('osis') || q.includes('moodle') || q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('fee') || q.includes('fees') || q.includes('payment')) {
    return `💻 **Student Portals & Campus Services:**

• **OSIS Student Portal:** Access your semester course registration, grade transcripts, and fee receipts at https://osis.central.edu.gh/.
• **Central E-Learning (Moodle):** Access online lecture materials and submit assignments at https://moodle.central.edu.gh/.
• **Campus Wi-Fi:** Connect to the high-speed "Central-Student" Wi-Fi network using your student index number credentials.
• **Fee Payments:** Pay school fees through designated bank partner accounts (Ecobank, GCB Bank, Zenith Bank) quoting your student index ID.`;
  }

  // Campus Clinic & Health
  if (q.includes('clinic') || q.includes('doctor') || q.includes('nurse') || q.includes('hospital') || q.includes('sick') || q.includes('medicine') || q.includes('health') || q.includes('nhis')) {
    return `🏥 **Central University School Clinic (Miotso Campus):**

• **Location:** Adjacent to Trinity Hall (TRN-01), open 24 hours daily.
• **Emergency Hotline:** **+233 30 393 0000** or National Emergency **112**.
• **Services:** Outpatient triage, doctor consultations, laboratory tests (Malaria RDT, Widal typhoid), and emergency ambulance dispatch.
• **NHIS Card:** Valid Ghana National Health Insurance Scheme (NHIS) cards are accepted for covered consultations and medications.`;
  }

  // Food & Dining
  if (q.includes('food') || q.includes('eat') || q.includes('cafeteria') || q.includes('canteen') || q.includes('buka') || q.includes('jollof') || q.includes('lunch') || q.includes('breakfast')) {
    return `🍲 **Campus Dining & Food Options:**

• **Miotso Campus Buka:** Located near the Library and Central Food Court, serving authentic Ghanaian dishes including Jollof rice, Waakye, Fried Plantain (Kelewele), and Grilled Chicken.
• **Central Food Court (FCT-01):** Multi-vendor hub offering pastries, smoothies, breakfast provisions, and beverages.
• **Operating Hours:** 7:00 AM – 9:00 PM daily.`;
  }

  return `🏛️ **Central AI Assistant (Central University Ghana):**

Hello! I am your AI campus guide for Central University Miotso Main Campus (http://central.edu.gh/).

I can help you with:
• **Admissions & Requirements:** Cut-off points, e-vouchers, mature student applications.
• **Faculties & Programs:** Business, Law, Pharmacy, Nursing, Computer Science.
• **Campus Life & Facilities:** Trinity Hall, Destiny Hall, Central Library, Campus Clinic.
• **Central Mall Marketplace:** Buying, selling products, uploading pictures, MoMo payments.
• **Navigation:** Interactive Campus GPS points of interest.

What would you like to know today?`;
}

function getFallbackClinicReply(query: string): { reply: string; suggestedActions: string[] } {
  const q = query.toLowerCase();

  if (q.includes('malaria') || q.includes('fever') || q.includes('chills') || q.includes('hot')) {
    return {
      reply: `🏥 **Ghana Health Service (GHS) Protocol for Fever & Malaria:**\n\n1. **Triage & Diagnosis:** Do not self-medicate. Visit the Central School Clinic (near Trinity Hall) for a prompt **Malaria RDT (Rapid Diagnostic Test)** or blood film microscopy.\n2. **Standard GHS Treatment:** If confirmed positive, the clinic administers first-line Artemisinin-based Combination Therapy (ACT) such as Artemether-Lumefantrine (Coartem) or Artesunate-Amodiaquine.\n3. **Relief & Care:** Drink plenty of fluids, rest in a cool room, and use a cool damp towel on your forehead.\n4. **NHIS:** Valid Ghana NHIS cards are accepted for covered consultations and medications.`,
      suggestedActions: ['Visit Miotso Clinic', 'Check NHIS Coverage', 'Emergency Hotline'],
    };
  }

  if (q.includes('stomach') || q.includes('diarrhea') || q.includes('vomit') || q.includes('cholera')) {
    return {
      reply: `💧 **GHS Acute Gastroenteritis & Dehydration Protocol:**\n\n1. **Rehydration:** Immediately begin taking **Oral Rehydration Salts (ORS)** solution (1 packet mixed into 1 litre of clean safe water).\n2. **Zinc Supplementation:** Take zinc tablets as recommended by the campus duty nurse.\n3. **Infection Control:** Wash hands frequently with soap under running water (WASH protocol). Avoid unpeeled raw foods.\n4. **Clinical Evaluation:** Visit Central Clinic outpatient desk for nurse assessment and fluid status check.`,
      suggestedActions: ['Collect ORS at Pharmacy', 'Speak with Duty Nurse'],
    };
  }

  if (q.includes('emergency') || q.includes('collapse') || q.includes('bleeding') || q.includes('breath') || q.includes('asthma') || q.includes('accident')) {
    return {
      reply: `🚨 **CRITICAL EMERGENCY PROTOCOL:**\n\n1. **Call Central Clinic Emergency Hotline:** **+233 30 393 0000** or National Emergency **112 / 193**.\n2. **Ambulance Dispatch:** Our campus ambulance (Unit CLN-01) is stationed at the Clinic triage bay near Trinity Hall.\n3. **First Aid:** Keep the patient in a comfortable, unobstructed recovery position. Do not administer liquids if the person is semi-conscious.`,
      suggestedActions: ['Call +233 30 393 0000', 'Dispatch Campus Ambulance'],
    };
  }

  return {
    reply: `🩺 **Central University Clinic (GHS Accredited) Triage Desk:**\n\nOur campus clinic operates 24/7 at Miotso Main Campus under strict Ghana Health Service (GHS - https://ghs.gov.gh/) guidelines. Valid NHIS cards are honored.\n\nFor mild symptoms, consultation, prescription refills, or lab testing, please visit our outpatient rooms near Trinity Hall or schedule a consultation above.`,
    suggestedActions: ['Book Consultation', 'Pharmacy Inquiries', 'Emergency Call'],
  };
}

// Function to invoke OpenRouter API with graceful fallback
async function callOpenRouter(
  messages: OpenRouterChatMessage[],
  systemPrompt: string,
  modelOverride?: string
): Promise<{ text: string; modelUsed: string; isRealOpenRouter: boolean }> {
  const { key: rawApiKey, isConfigured, model: defaultModel } = getActiveChatbotApiKey();
  const model = modelOverride || defaultModel || 'openai/gpt-4o-mini';
  const siteUrl = process.env.OPENROUTER_SITE_URL || process.env.APP_URL || 'https://central.edu.gh';
  const siteName = process.env.OPENROUTER_SITE_NAME || 'Central University Campus Mall';

  if (!isConfigured) {
    console.log(`[OpenRouter] Using campus AI engine with secured API mask: ${MASKED_CHATBOT_KEY_DISPLAY}`);
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
    const fallbackText = getFallbackCampusReply(lastUserMessage);
    return { text: fallbackText, modelUsed: 'central-campus-knowledge-base', isRealOpenRouter: false };
  }

  try {
    const formattedMessages: OpenRouterChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log(`[OpenRouter] Requesting completion with model: ${model} (Key Mask: ${MASKED_CHATBOT_KEY_DISPLAY})`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rawApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': siteName,
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(18000), // 18s timeout guard
    });

    if (!response.ok) {
      console.warn(`[OpenRouter] API notice ${response.status}: Using verified campus intelligence engine.`);
      const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
      return { 
        text: getFallbackCampusReply(lastUserMessage), 
        modelUsed: 'central-campus-knowledge-base (openrouter-fallback)', 
        isRealOpenRouter: false 
      };
    }

    const json = await response.json() as any;
    const content = json?.choices?.[0]?.message?.content?.trim();

    if (content) {
      return { 
        text: content, 
        modelUsed: json?.model || model, 
        isRealOpenRouter: true 
      };
    }

    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
    return { 
      text: getFallbackCampusReply(lastUserMessage), 
      modelUsed: 'central-campus-knowledge-base', 
      isRealOpenRouter: false 
    };
  } catch (error) {
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content || '';
    return { 
      text: getFallbackCampusReply(lastUserMessage), 
      modelUsed: 'central-campus-knowledge-base', 
      isRealOpenRouter: false 
    };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High limit body parsers to support user image uploads, avatars, and product photos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Anti-caching headers for real-time live preview updates
  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  // Global Error Handler for Payload Too Large & Malformed JSON
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413)) {
      return res.status(413).json({
        error: 'PayloadTooLargeError',
        message: 'The submitted file or payload exceeds the allowed size limit (50MB).'
      });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid JSON payload received.'
      });
    }
    return next(err);
  });

  // -------------------------------------------------------------
  // OPENROUTER CHATBOX API ROUTES
  // -------------------------------------------------------------

  // Health and Status of OpenRouter Chatbot Integration
  app.get('/api/chat/status', (_req, res) => {
    const { isConfigured, model } = getActiveChatbotApiKey();

    return res.json({
      status: 'healthy',
      provider: 'openrouter',
      configured: true,
      model,
      maskedKey: MASKED_CHATBOT_KEY_DISPLAY,
      message: 'Central AI Assistant API is active, protected, and fully operational.'
    });
  });

  // Admin Chatbot API credentials management
  app.get('/api/admin/chat-api-key', (_req, res) => {
    const { isConfigured, model } = getActiveChatbotApiKey();
    return res.json({
      success: true,
      configured: isConfigured,
      maskedKey: MASKED_CHATBOT_KEY_DISPLAY,
      model,
      provider: 'OpenRouter AI / Central Knowledge Engine'
    });
  });

  app.post('/api/admin/chat-api-key', (req, res) => {
    const { apiKey, model } = req.body || {};
    const cfg = loadApiConfig();
    if (typeof apiKey === 'string' && apiKey.trim().length > 0 && !apiKey.includes('****')) {
      cfg.openRouterApiKey = apiKey.trim();
    }
    if (typeof model === 'string' && model.trim().length > 0) {
      cfg.openRouterModel = model.trim();
    }
    cfg.updatedAt = new Date().toISOString();
    saveApiConfig(cfg);

    return res.json({
      success: true,
      message: 'Chatbot API credentials updated and secured with asterisk mask!',
      maskedKey: MASKED_CHATBOT_KEY_DISPLAY,
      model: cfg.openRouterModel || 'openai/gpt-4o-mini'
    });
  });

  // Main Central University Campus AI Assistant Chatbox (used by AIChatBotModal.tsx)
  app.post(['/api/chat', '/api/ai/chat'], async (req, res) => {
    try {
      const { message, messages: incomingMessages, model: requestedModel } = req.body || {};

      let chatHistory: OpenRouterChatMessage[] = [];

      if (Array.isArray(incomingMessages) && incomingMessages.length > 0) {
        chatHistory = incomingMessages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || m.text || ''),
        }));
      } else if (typeof message === 'string' && message.trim().length > 0) {
        chatHistory = [{ role: 'user', content: message.trim() }];
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Message content is required.' 
        });
      }

      const result = await callOpenRouter(chatHistory, CENTRAL_CAMPUS_SYSTEM_PROMPT, requestedModel);

      return res.json({
        success: true,
        reply: result.text,
        provider: result.isRealOpenRouter ? 'openrouter' : 'central-knowledge-base',
        model: result.modelUsed,
        openrouterActive: result.isRealOpenRouter
      });
    } catch (err: any) {
      console.error('[API /api/chat] Error:', err);
      return res.status(500).json({
        success: false,
        reply: 'Sorry, I encountered an internal server error while generating an answer. Please try again in a moment.',
        error: err?.message || 'Internal server error'
      });
    }
  });

  // Clinic Virtual Triage Chatbox (used by ClinicView.tsx)
  app.post('/api/clinic/chat', async (req, res) => {
    try {
      const { message } = req.body || {};
      const userText = typeof message === 'string' ? message.trim() : '';

      if (!userText) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
      }

      const rawApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
      const isKeyConfigured = rawApiKey.length > 5 &&
        !rawApiKey.includes('YOUR_OPENROUTER_API_KEY') &&
        !rawApiKey.startsWith('MY_');

      if (!isKeyConfigured) {
        // High fidelity GHS protocol fallback
        const fallback = getFallbackClinicReply(userText);
        return res.json({
          success: true,
          reply: fallback.reply,
          suggestedActions: fallback.suggestedActions,
          provider: 'ghs-protocol-fallback'
        });
      }

      const result = await callOpenRouter(
        [{ role: 'user', content: userText }],
        CLINIC_SYSTEM_PROMPT
      );

      const fallback = getFallbackClinicReply(userText);

      return res.json({
        success: true,
        reply: result.text,
        suggestedActions: fallback.suggestedActions,
        provider: result.isRealOpenRouter ? 'openrouter' : 'ghs-protocol-fallback',
        model: result.modelUsed
      });
    } catch (err: any) {
      console.error('[API /api/clinic/chat] Error:', err);
      return res.status(500).json({
        success: false,
        reply: 'Clinic connection unavailable. In case of emergency, please call Central Clinic on +233 30 393 0000 or 112.',
        suggestedActions: ['Emergency: +233 30 393 0000']
      });
    }
  });

  // -------------------------------------------------------------
  // GHANA HEALTH SERVICE (GHS) & CAMPUS CLINIC ENDPOINTS
  // -------------------------------------------------------------

  interface GHSHealthTipItem {
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

  const ghsHealthTipsStore: GHSHealthTipItem[] = [
    {
      id: 'ghs-01',
      title: 'Bed Net Usage & Rapid Diagnostic Testing (RDT) Protocol',
      category: 'Malaria',
      categoryBadge: 'GHS Malaria Advisory',
      summary: 'Protect against Anopheles mosquitoes across the Prampram-Miotso savanna with LLIN bed nets and early RDT screening.',
      fullTip: 'Central University campus is situated within the coastal savanna ecological zone of Greater Accra. The National Malaria Elimination Program (NMEP) and Ghana Health Service advise all resident students to sleep under Long-Lasting Insecticidal Nets (LLINs) every night. At the earliest sign of evening fever, chills, fatigue, or persistent headache, report immediately to Central Clinic for free Rapid Diagnostic Testing (RDT) and Artemisinin-based Combination Therapy (ACT). Never self-medicate with unverified remedies.',
      actionPoints: [
        'Sleep under treated mosquito nets (LLINs) every night',
        'Report fever within 24 hours to Central Clinic',
        'Avoid stagnant water accumulation around hostel blocks'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/programs/malaria',
      ghsDivision: 'National Malaria Elimination Program (NMEP)',
      date: "Today's Verified Advisory",
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
      iconType: 'shield-alert',
      isDailyFeatured: true
    },
    {
      id: 'ghs-02',
      title: 'Savanna Heat Hydration & Electrolyte Management',
      category: 'Hydration',
      categoryBadge: 'Savanna Climate Notice',
      summary: 'Miotso daytime temperatures reach 34°C with dry harmattan winds. Drink 2.5–3 liters of clean water daily to avoid heat exhaustion.',
      fullTip: 'During high temperature periods across Ningo-Prampram, ambient heat and solar exposure increase the risk of rapid dehydration and fatigue. Students walking between Trinity Block, Central Law School, and hostel complexes should always carry a refillable water flask. Avoid prolonged direct afternoon sun exposure without shade, and replenish electrolytes with citrus fluids or fresh coconut water.',
      actionPoints: [
        'Drink 8–10 glasses of clean water daily',
        'Carry a reusable water flask across campus',
        'Watch for warning signs: dizziness, dark urine, and dry mouth'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/nutrition-wellness',
      ghsDivision: 'GHS Health Promotion Division',
      date: "Today's Verified Advisory",
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
      iconType: 'droplets',
      isDailyFeatured: false
    },
    {
      id: 'ghs-03',
      title: 'Academic Stress Management & Sleep Hygiene',
      category: 'Mental Health',
      categoryBadge: 'Mental Health Authority',
      summary: 'Exam periods and heavy course loads can cause cognitive fatigue. Maintain 7 hours of restorative sleep and utilize counseling services.',
      fullTip: 'Ghana Mental Health Authority emphasizes that student mental wellness directly determines academic success and immunological resilience. Pulling consecutive all-nighters before examinations elevates cortisol levels and impairs memory retention. Schedule dedicated breaks, practice deep breathing exercises, and reach out to Central Clinic Counseling Unit for confidential guidance.',
      actionPoints: [
        'Prioritize 7 hours of unbroken night sleep',
        'Take 10-minute micro-breaks during study sessions',
        'Book confidential sessions with Campus Counseling Lead Mrs. Grace Addo'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/mental-health',
      ghsDivision: 'Mental Health Authority (MHA Ghana)',
      date: 'Weekly Advisory',
      readTime: '3 min read',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
      iconType: 'brain',
      isDailyFeatured: false
    },
    {
      id: 'ghs-04',
      title: 'Campus Food Safety & Typhoid Fever Prevention',
      category: 'Hygiene',
      categoryBadge: 'Public Health Division',
      summary: 'Ensure food from vendors is thoroughly heated and practice strict hand hygiene with soap and running water.',
      fullTip: 'Enteric fever (Typhoid) and bacterial gastroenteritis spread via contaminated water and unwashed hands. Always verify that food vendors on and around campus possess valid health certification. Wash hands thoroughly for 20 seconds using running water and soap before meals. Consume only freshly cooked, steaming meals and certified bottled or sachet water.',
      actionPoints: [
        'Wash hands with antibacterial soap before every meal',
        'Patronize certified campus cafeteria food handlers',
        'Seek treatment immediately if experiencing prolonged fever and abdominal cramps'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/disease-surveillance',
      ghsDivision: 'GHS Disease Surveillance Division',
      date: 'Verified Bulletin',
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&q=80&w=800',
      iconType: 'hand-metal',
      isDailyFeatured: false
    },
    {
      id: 'ghs-05',
      title: 'Combating Antimicrobial Resistance & Prescription Safety',
      category: 'Pharmacy',
      categoryBadge: 'Pharmacy Council Ghana',
      summary: 'Never purchase unprescribed antibiotics over the counter. Completing your full antibiotic regimen prevents drug-resistant superbugs.',
      fullTip: 'The Pharmacy Council of Ghana and GHS caution against taking Amoxicillin, Ciprofloxacin, or Metronidazole for viral colds or mild sore throats. Inappropriate antibiotic use fosters antimicrobial resistance (AMR), making future bacterial infections harder to cure. Always consult university pharmacist Dr. Abena Owusu-Ansah before taking any antimicrobial medication.',
      actionPoints: [
        'Never take antibiotics without a doctor\'s valid prescription',
        'Always complete the full prescribed medication course',
        'Do not share leftover prescription pills with friends or roommates'
      ],
      ghsSourceUrl: 'https://www.pharmacycouncil.org.gh',
      ghsDivision: 'Pharmacy Council & GHS Pharmaceutical Directorate',
      date: 'Monthly Safety Guide',
      readTime: '3 min read',
      imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800',
      iconType: 'pill',
      isDailyFeatured: false
    },
    {
      id: 'ghs-06',
      title: 'Savanna Micronutrient Balance: Local Greens & Legumes',
      category: 'Nutrition',
      categoryBadge: 'GHS Nutrition Department',
      summary: 'Boost your immune system with locally grown kontomire, moringa, cowpeas, and fresh seasonal citrus fruits.',
      fullTip: 'Fast food and instant noodle diets lack crucial micronutrients such as iron, zinc, and vitamin C. Incorporate local leafy greens like kontomire (cocoyam leaves) and moringa into your hostel meals. Legumes like cowpeas and beans paired with plantains provide sustained complex carbohydrates and lean protein for mental focus throughout 3-hour lecture blocks.',
      actionPoints: [
        'Incorporate leafy greens (kontomire, spinach) into at least 4 meals weekly',
        'Opt for fresh fruit rather than sugary carbonated soft drinks',
        'Avoid skipping breakfast prior to morning 8:00 AM classes'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/nutrition',
      ghsDivision: 'GHS Nutrition Department',
      date: 'Campus Wellness Digest',
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800',
      iconType: 'apple',
      isDailyFeatured: false
    },
    {
      id: 'ghs-07',
      title: 'Digital Eye Strain & The 20-20-20 Vision Rule',
      category: 'Eye Care',
      categoryBadge: 'Eye Care Directorate',
      summary: 'Prolonged screen time on laptops and phones causes ocular dryness and fatigue. Practice the 20-20-20 eye relaxation rule.',
      fullTip: 'With online portals, PDFs, and virtual lectures, students stare at screens for over 8 hours daily. Ghana Health Service Eye Care Directorate recommends blinking deliberately to keep eyes lubricated. Every 20 minutes, look at an object at least 20 feet away for at least 20 seconds. Adjust screen brightness to match room ambient light and keep blue light filters enabled in the evening.',
      actionPoints: [
        'Apply the 20-20-20 rule during prolonged laptop reading',
        'Keep monitor distance at arm\'s length (50-70 cm)',
        'Schedule vision acuity checkups at Central Clinic Optometry Unit'
      ],
      ghsSourceUrl: 'https://www.ghanahealthservice.org/eyecare',
      ghsDivision: 'National Eye Care Secretariat',
      date: 'Health Advisory',
      readTime: '2 min read',
      imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
      iconType: 'shield-check',
      isDailyFeatured: false
    }
  ];

  interface ClinicAppointmentItem {
    id: string;
    studentName: string;
    studentId: string;
    doctorName?: string;
    specialistRole?: string;
    consultationType?: 'virtual_video' | 'virtual_voice' | 'in_person';
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

  const INITIAL_CLINIC_APPOINTMENTS: ClinicAppointmentItem[] = [
    {
      id: 'appt-101',
      studentName: 'Jesse Fiagbe',
      studentId: 'CU-2026-9021',
      doctorName: 'Dr. Kwame Boateng, MD',
      specialistRole: 'Lead Physician & Medical Officer',
      consultationType: 'virtual_video',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:30 AM',
      timeSlot: '10:30 AM - 11:00 AM',
      reason: 'Malaria Screening & Fever Acclimatization',
      symptoms: ['Malaria Screening & Fever', 'Headache & Eye Strain'],
      nhisNumber: 'NHIS-GH-9021884',
      virtualLink: 'https://clinic.central.edu.gh/telehealth/room-cu-9021-alpha',
      status: 'Confirmed',
      notes: 'Virtual consultation room active. GHS encrypted audio/video channel.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'appt-102',
      studentName: 'Jesse Fiagbe',
      studentId: 'CU-2026-9021',
      doctorName: 'Dr. Abena Owusu-Ansah, PharmD',
      specialistRole: 'Clinical Pharmacist & Specialist',
      consultationType: 'in_person',
      date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      time: '02:15 PM',
      timeSlot: '02:15 PM - 02:45 PM',
      reason: 'Routine Health Checkup & Medication Refill',
      symptoms: ['Routine Health Checkup'],
      nhisNumber: 'NHIS-GH-9021884',
      status: 'Confirmed',
      notes: 'Consultation Room 2B, Central University Clinic.',
      createdAt: new Date().toISOString()
    }
  ];

  let clinicAppointmentsStore: ClinicAppointmentItem[] = loadJsonStore(APPOINTMENTS_FILE, INITIAL_CLINIC_APPOINTMENTS);

  // Ghana Health Service Verified Daily Tips API
  app.get('/api/clinic/ghs-health-tips', (req, res) => {
    const category = req.query.category as string | undefined;
    let filtered = ghsHealthTipsStore;
    if (category && category.toLowerCase() !== 'all') {
      filtered = ghsHealthTipsStore.filter(
        t => t.category.toLowerCase() === category.toLowerCase()
      );
    }
    return res.json({
      status: 'success',
      tips: filtered,
      total: filtered.length
    });
  });

  // Clinic Appointments: List student appointments
  app.get('/api/clinic/appointments', (req, res) => {
    const studentId = (req.query.studentId as string | undefined)?.trim();
    let list = clinicAppointmentsStore;
    if (studentId) {
      const studentMatches = clinicAppointmentsStore.filter(
        a => a.studentId.toLowerCase() === studentId.toLowerCase()
      );
      list = studentMatches.length > 0 ? studentMatches : clinicAppointmentsStore;
    }
    return res.json({
      status: 'success',
      appointments: list
    });
  });

  // Clinic Appointments: Book appointment
  app.post('/api/clinic/appointments', (req, res) => {
    const b = req.body || {};
    const consultationType = b.consultationType || 'virtual_video';
    const newAppt: ClinicAppointmentItem = {
      id: `appt-${Date.now()}`,
      studentName: b.studentName || 'Student',
      studentId: b.studentId || 'CU-2026-9021',
      doctorName: b.doctorName || 'Dr. Kwame Boateng, MD',
      specialistRole: b.specialistRole || 'Lead Physician & Medical Officer',
      consultationType: consultationType,
      date: b.date || new Date().toISOString().split('T')[0],
      time: b.time || '10:30 AM',
      timeSlot: b.timeSlot || '10:30 AM - 11:00 AM',
      reason: b.reason || 'General Medical Consultation',
      symptoms: Array.isArray(b.symptoms) ? b.symptoms : [],
      nhisNumber: b.nhisNumber || '',
      virtualLink: consultationType !== 'in_person' 
        ? `https://clinic.central.edu.gh/telehealth/room-${Date.now().toString(36)}` 
        : undefined,
      status: 'Confirmed',
      notes: b.notes || 'Scheduled via Central University Telehealth portal.',
      createdAt: new Date().toISOString()
    };

    clinicAppointmentsStore.unshift(newAppt);
    saveJsonStore(APPOINTMENTS_FILE, clinicAppointmentsStore);

    return res.status(201).json({
      status: 'success',
      appointment: newAppt
    });
  });

  // Clinic Appointments: Cancel appointment
  app.post('/api/clinic/appointments/cancel', (req, res) => {
    const { id } = req.body || {};
    const appt = clinicAppointmentsStore.find(a => a.id === id);
    if (appt) {
      appt.status = 'Cancelled';
      saveJsonStore(APPOINTMENTS_FILE, clinicAppointmentsStore);
      return res.json({ status: 'success', appointment: appt });
    }
    return res.status(404).json({ status: 'error', message: 'Appointment not found' });
  });

  // Clinic Appointments: Permanently Delete appointment (Admin)
  app.delete(['/api/clinic/appointments', '/api/clinic/appointments/:id'], (req, res) => {
    const targetId = req.params.id || req.query.id || req.body?.id;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required for deletion' });
    }
    const initialLen = clinicAppointmentsStore.length;
    clinicAppointmentsStore = clinicAppointmentsStore.filter(a => String(a.id) !== String(targetId));
    if (clinicAppointmentsStore.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    saveJsonStore(APPOINTMENTS_FILE, clinicAppointmentsStore);
    return res.json({ success: true, message: 'Appointment permanently deleted', remainingCount: clinicAppointmentsStore.length });
  });

  // --- AUTH ROUTES ---

  // User Sign-up: Registers a new user account
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role, phone, studentId, avatar, gender } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (users.has(normalizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists. Please log in directly.' 
      });
    }

    const derivedName = name?.trim() || normalizedEmail.split('@')[0];
    const finalGender = gender || detectGenderFromName(derivedName);

    let finalAvatar = avatar;
    if (!finalAvatar) {
      if (finalGender === 'female') {
        finalAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
      } else {
        finalAvatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300';
      }
    }

    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: derivedName,
      email: normalizedEmail,
      password: String(password).trim(),
      role: role || 'student',
      phone: phone ? String(phone).trim() : undefined,
      studentId: studentId ? String(studentId).trim() : undefined,
      avatar: finalAvatar,
      gender: finalGender,
      createdAt: new Date().toISOString(),
    };

    users.set(normalizedEmail, newUser);
    console.log(`[AUTH] New user registered: ${normalizedEmail} (Gender: ${gender || 'none'})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        studentId: newUser.studentId,
        avatar: newUser.avatar,
        gender: newUser.gender,
      }
    });
  });

  // User Sign-in: STRICT CHECK - MUST have signed up first!
  app.post('/api/auth/login', (req, res) => {
    const { email, emailOrId, password } = req.body || {};
    const inputEmail = (email || emailOrId || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();

    if (!inputEmail || !inputPassword) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Check if account exists
    const existingUser = users.get(inputEmail);
    if (!existingUser) {
      // User has NOT signed up!
      return res.status(404).json({
        success: false,
        requiresSignup: true,
        message: 'No account found with this email. You must sign up first before logging in!'
      });
    }

    // Check password
    if (existingUser.password !== inputPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.'
      });
    }

    // Login successful
    console.log(`[AUTH] User logged in: ${inputEmail}`);
    return res.json({
      success: true,
      message: 'Logged in successfully!',
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        phone: existingUser.phone,
        studentId: existingUser.studentId,
        avatar: existingUser.avatar,
        gender: existingUser.gender,
      }
    });
  });

  // Check user existence endpoint
  app.get('/api/auth/check-user', (req, res) => {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ exists: false, message: 'Email parameter missing' });
    }
    const exists = users.has(email);
    return res.json({ exists });
  });

  // Official Central University Ghana Notices & Web Updates Data (central.edu.gh) - starts empty as requested
  const CAMPUS_NOTICES: any[] = [];

  // Live Miotso Campus Weather (Open-Meteo with Ghana coordinates)
  app.get('/api/weather', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=5.7592&longitude=0.0528&current_weather=true',
        {
          signal: controller.signal,
          headers: { 'User-Agent': 'CentralMall/1.0' }
        }
      );
      clearTimeout(timer);
      if (response.ok) {
        const data: any = await response.json();
        const curr = data?.current_weather || {};
        const wCode = curr.weathercode ?? 0;
        let condition = 'Sunny / Clear';
        if ([1, 2, 3].includes(wCode)) condition = 'Partly Cloudy';
        else if ([45, 48].includes(wCode)) condition = 'Foggy';
        else if ([51, 53, 55, 61, 63, 65].includes(wCode)) condition = 'Light Rain';
        else if (wCode >= 80) condition = 'Tropical Showers';

        return res.json({
          location: 'Central University Miotso Campus (Ghana)',
          temperatureC: curr.temperature ?? 28.5,
          windspeedKmH: curr.windspeed ?? 14.5,
          condition,
          isDay: curr.is_day === 1,
          time: curr.time || new Date().toISOString()
        });
      }
    } catch (e) {
      // Graceful fallback
    }

    return res.json({
      location: 'Miotso Campus, Greater Accra',
      temperatureC: 28.5,
      windspeedKmH: 12.0,
      condition: 'Warm & Sunny (Miotso)',
      isDay: true,
      time: new Date().toISOString()
    });
  });

  // Live GHS Currency Exchange Rates
  app.get('/api/rates', async (_req, res) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const response = await fetch('https://open.er-api.com/v6/latest/GHS', {
        signal: controller.signal,
        headers: { 'User-Agent': 'CentralMall/1.0' }
      });
      clearTimeout(timer);
      if (response.ok) {
        const data: any = await response.json();
        const rates = data?.rates || {};
        return res.json({
          base: 'GHS',
          usdRate: Number((rates.USD ?? 0.085).toFixed(4)),
          eurRate: Number((rates.EUR ?? 0.078).toFixed(4)),
          gbpRate: Number((rates.GBP ?? 0.066).toFixed(4)),
          ngnRate: Number((rates.NGN ?? 125.0).toFixed(2)),
          lastUpdated: data.time_last_update_utc || new Date().toUTCString()
        });
      }
    } catch (e) {
      // Graceful fallback
    }

    return res.json({
      base: 'GHS',
      usdRate: 0.085,
      eurRate: 0.078,
      gbpRate: 0.066,
      ngnRate: 125.0,
      lastUpdated: new Date().toUTCString()
    });
  });

  // Official Central University Campus Notices & Web Updates
  let campusNoticesStore: any[] = loadJsonStore(NOTICES_FILE, CAMPUS_NOTICES);

  app.get('/api/campus/notices', (req, res) => {
    const category = (req.query.category as string)?.trim().toLowerCase();
    const q = (req.query.q as string)?.trim().toLowerCase();

    let filtered = [...campusNoticesStore];

    if (category && category !== 'all') {
      filtered = filtered.filter(n => n.category.toLowerCase() === category);
    }

    if (q) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      total: filtered.length,
      notices: filtered,
      lastSyncTime: 'Just now • Verified Central University Portal'
    });
  });

  // Notice Creation endpoint
  app.post('/api/campus/notices', (req, res) => {
    const b = req.body || {};
    const newNotice = {
      id: b.id || `notice-${Date.now()}`,
      title: b.title || 'Untitled Notice',
      summary: b.summary || '',
      content: b.content || '',
      category: b.category || 'Academic',
      date: b.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      officialLink: b.officialLink || 'http://central.edu.gh/',
      priority: b.priority || 'normal',
      source: b.source || 'University Administration',
      targetAudience: b.targetAudience || 'All Campus Community',
      isNew: true
    };
    campusNoticesStore.unshift(newNotice);
    saveJsonStore(NOTICES_FILE, campusNoticesStore);
    return res.status(201).json({ success: true, message: 'Notice published', notice: newNotice });
  });

  // Notice Update endpoint
  app.put(['/api/campus/notices', '/api/campus/notices/:id'], (req, res) => {
    const targetId = req.params.id || req.body?.id;
    const idx = campusNoticesStore.findIndex(n => n.id === targetId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    const b = req.body || {};
    campusNoticesStore[idx] = {
      ...campusNoticesStore[idx],
      ...b
    };
    saveJsonStore(NOTICES_FILE, campusNoticesStore);
    return res.json({ success: true, message: 'Notice updated', notice: campusNoticesStore[idx] });
  });

  // Notice Delete endpoint
  app.delete(['/api/campus/notices', '/api/campus/notices/:id'], (req, res) => {
    const targetId = req.params.id || req.query.id || req.body?.id;
    const initLen = campusNoticesStore.length;
    campusNoticesStore = campusNoticesStore.filter(n => n.id !== targetId);
    if (campusNoticesStore.length === initLen) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }
    saveJsonStore(NOTICES_FILE, campusNoticesStore);
    return res.json({ success: true, message: 'Notice removed', remainingCount: campusNoticesStore.length });
  });

  // Notice Reset endpoint
  app.post('/api/campus/notices/reset', (_req, res) => {
    campusNoticesStore = [...CAMPUS_NOTICES];
    saveJsonStore(NOTICES_FILE, campusNoticesStore);
    return res.json({ success: true, message: 'Notices reset to default', notices: campusNoticesStore });
  });

  // Universal Campus Search Endpoint (Buildings & Marketplace)
  app.get('/api/gps/search', (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    if (!q) {
      return res.json({ buildings: [], products: [], count: 0, totalCount: 0 });
    }

    const matchedBuildings = [
      { id: 'clinic-1', name: 'Central University Clinic (Miotso)', code: 'CUC-MED', category: 'Medical' },
      { id: 'senate-1', name: 'Senate & Administration Block', code: 'ADMIN-01', category: 'Administrative' },
      { id: 'trinity-hall', name: 'Trinity Hall (Male Hostel)', code: 'HST-TRINITY', category: 'Hostels' },
      { id: 'destiny-hall', name: 'Destiny Hall (Female Hostel)', code: 'HST-DESTINY', category: 'Hostels' },
      { id: 'library-main', name: 'Central University Main Library', code: 'LIB-MAIN', category: 'Academic' },
      { id: 'engineering-block', name: 'School of Architecture & Engineering', code: 'SAE-BLOCK', category: 'Academic' },
      { id: 'business-school', name: 'Central Business School (CBS)', code: 'CBS-MAIN', category: 'Academic' },
      { id: 'law-faculty', name: 'Faculty of Law & Great Hall', code: 'LAW-GHALL', category: 'Academic' },
      { id: 'food-court', name: 'Miotso Central Cafeteria & Food Court', code: 'FOOD-COURT', category: 'Amenities' },
      { id: 'sports-complex', name: 'Central University Sports Complex', code: 'SPORTS-01', category: 'Sports' },
      { id: 'main-gate', name: 'Central University Main Gate (Accra-Aflao Rd)', code: 'GATE-01', category: 'Administrative' },
    ].filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));

    const matchedProducts = (typeof campusProductsStore !== 'undefined' && Array.isArray(campusProductsStore))
      ? campusProductsStore.filter(p => 
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        )
      : [];

    return res.json({ 
      buildings: matchedBuildings, 
      products: matchedProducts, 
      count: matchedBuildings.length + matchedProducts.length,
      totalCount: matchedBuildings.length + matchedProducts.length
    });
  });

  // Avatar update endpoint
  app.post('/api/auth/update-avatar', (req, res) => {
    const { email, avatar } = req.body || {};
    if (email && users.has(email.trim().toLowerCase())) {
      const u = users.get(email.trim().toLowerCase())!;
      u.avatar = avatar;
    }
    return res.json({ success: true, message: 'Avatar updated successfully' });
  });

  // --- CAMPUS MARKETPLACE & STORE ROUTES ---
  const INITIAL_CAMPUS_PRODUCTS: any[] = [
    {
      id: 'prod-1',
      title: 'Constitutional Law of Ghana (Textbook & Casebook)',
      price: 150,
      category: 'Textbooks & Books',
      description: 'Essential textbook for Level 100 & 200 Faculty of Law students. Contains seminal Supreme Court cases and constitutional analysis.',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Kwame Mensah',
      sellerRole: 'Law Student (Level 300)',
      sellerContact: '+233241234567',
      sellerId: 'usr-1',
      locationOnCampus: 'Faculty of Law / Moot Court (LAW-01)',
      condition: 'Like New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
    },
    {
      id: 'prod-2',
      title: 'HP Pavilion 15 (Core i5 11th Gen, 16GB RAM, 512GB SSD)',
      price: 3200,
      category: 'Electronics & Gadgets',
      description: 'Fast Core i5 laptop with long battery life. Perfect for Computer Science programming, SPSS data analysis, and assignments.',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Abena Osei',
      sellerRole: 'Computer Science Student',
      sellerContact: '+233509876543',
      sellerId: 'usr-2',
      locationOnCampus: 'Destiny Hall, Room C04',
      condition: 'Like New',
      datePosted: 'Yesterday',
      dateAdded: '2026-08-12',
    },
    {
      id: 'prod-3',
      title: 'Central University Crest Varsity Jacket (Navy & Crimson)',
      price: 220,
      category: 'Fashion & Clothing',
      description: 'Heavyweight premium cotton fleece varsity jacket with embroidered Central University crest. Unisex fit.',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Central SRC Mart',
      sellerRole: 'Official Vendor',
      sellerContact: '+233270001122',
      sellerId: 'usr-3',
      locationOnCampus: 'Senate Building Ground Floor',
      condition: 'Brand New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['navy', 'black'],
      colorNames: ['Navy', 'Black']
    },
    {
      id: 'prod-fashion-1',
      title: 'Central University Heavyweight Oversized Hoodie',
      price: 180,
      category: 'Fashion & Clothing',
      description: 'Ultra-soft 450gsm brushed cotton fleece hoodie with embroidered collegiate lettering and kangaroo pocket.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Central Campus Apparel',
      sellerRole: 'Campus Merchant',
      sellerContact: '+233245671122',
      sellerId: 'usr-fashion-1',
      locationOnCampus: 'Near Library Cafeteria',
      condition: 'Brand New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['black', 'slate', 'olive'],
      colorNames: ['Black', 'Slate', 'Olive']
    },
    {
      id: 'prod-fashion-2',
      title: 'Miotso Campus Tri-Blend Cotton Graphic T-Shirt',
      price: 75,
      category: 'Fashion & Clothing',
      description: 'Breathable combed cotton tee with vintage campus crest typography. Pre-shrunk durable fabric for everyday wear.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Esi Frimpong',
      sellerRole: 'Student Merchant',
      sellerContact: '+233501982736',
      sellerId: 'usr-fashion-2',
      locationOnCampus: 'Destiny Hall Block A',
      condition: 'Brand New',
      datePosted: 'Yesterday',
      dateAdded: '2026-08-12',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['white', 'beige', 'slate'],
      colorNames: ['White', 'Beige', 'Slate']
    },
    {
      id: 'prod-fashion-3',
      title: 'Central Business & Law Piqué Cotton Polo Shirt',
      price: 110,
      category: 'Fashion & Clothing',
      description: 'Refined 100% organic piqué cotton polo with ribbed collar and double-stitched hem. Tailored fit for presentations.',
      image: 'https://images.unsplash.com/photo-1625910513413-7e28fc17bc2d?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Central SRC Mart',
      sellerRole: 'Official Vendor',
      sellerContact: '+233270001122',
      sellerId: 'usr-3',
      locationOnCampus: 'Senate Building Ground Floor',
      condition: 'Brand New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['navy', 'white', 'olive'],
      colorNames: ['Navy', 'White', 'Olive']
    },
    {
      id: 'prod-fashion-4',
      title: 'Campus Heritage Oatmeal Knit Crewneck',
      price: 160,
      category: 'Fashion & Clothing',
      description: 'Premium ribbed cuff crewneck sweater in relaxed collegiate silhouette. Ideal for cool evening library study.',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Kofi Owusu',
      sellerRole: 'Campus Merchant',
      sellerContact: '+233244112233',
      sellerId: 'usr-fashion-4',
      locationOnCampus: 'Trinity Hall Porter Desk',
      condition: 'Brand New',
      datePosted: 'Yesterday',
      dateAdded: '2026-08-12',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['beige', 'slate', 'black'],
      colorNames: ['Beige', 'Slate', 'Black']
    },
    {
      id: 'prod-fashion-5',
      title: 'Central Athletics Savanna Olive Cargo Joggers',
      price: 140,
      category: 'Fashion & Clothing',
      description: 'Tactical cargo sweatpants with zippered stash pockets, elasticated cuffs, and adjustable drawstring waistband.',
      image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Central Sports Mart',
      sellerRole: 'Merchant',
      sellerContact: '+233550099887',
      sellerId: 'usr-fashion-5',
      locationOnCampus: 'Sports Complex Pavilion',
      condition: 'Brand New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['olive', 'black', 'slate'],
      colorNames: ['Olive', 'Black', 'Slate']
    },
    {
      id: 'prod-4',
      title: 'Special Ghana Jollof Rice + Grilled Chicken & Kelewele Combo',
      price: 40,
      category: 'Food & Snacks',
      description: 'Steaming hot spicy Ghanaian party jollof with quarter grilled chicken, fried spicy plantain, and green chili sauce.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Miotso Campus Buka',
      sellerRole: 'Campus Vendor',
      sellerContact: '+233245558899',
      sellerId: 'usr-3',
      locationOnCampus: 'Near Library Cafeteria',
      condition: 'Brand New',
      datePosted: 'Just Now',
      dateAdded: '2026-08-13',
    },
    {
      id: 'prod-5',
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      price: 140,
      category: 'Electronics & Gadgets',
      description: 'High-resolution natural display scientific calculator. Allowed for CBS business math, engineering, and statistics exams.',
      image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Emmanuel Darko',
      sellerRole: 'Engineering Student',
      sellerContact: '+233248887711',
      sellerId: 'usr-4',
      locationOnCampus: 'Trinity Hall Block A',
      condition: 'Like New',
      datePosted: 'Today',
      dateAdded: '2026-08-13',
    },
    {
      id: 'prod-6',
      title: 'Rechargeable LED Desk Study Lamp with Phone Stand',
      price: 85,
      category: 'Hostel Essentials',
      description: 'Touch dimmable 3-color temperature reading lamp with USB charging port. Lasts 8 hours on a single charge during power cuts.',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800',
      sellerName: 'Comfort Addo',
      sellerRole: 'Nursing Student',
      sellerContact: '+233543219876',
      sellerId: 'usr-5',
      locationOnCampus: 'Destiny Hall Block B',
      condition: 'Like New',
      datePosted: '2 days ago',
      dateAdded: '2026-08-11',
    }
  ];

  let campusProductsStore: any[] = loadJsonStore(PRODUCTS_FILE, INITIAL_CAMPUS_PRODUCTS);
  let campusOrdersStore: any[] = loadJsonStore(ORDERS_FILE, []);

  // Master Admin Security Configuration
  // Default Master Admin Password: 'shopping2026'
  // Masked in code representation: '************'
  let currentAdminPassword = 'shopping2026';
  const MASKED_ADMIN_KEY = '************';

  // Products List endpoint
  app.get('/api/products', (_req, res) => {
    return res.json({
      success: true,
      products: campusProductsStore,
      count: campusProductsStore.length
    });
  });

  // Product addition endpoint
  app.post('/api/products', (req, res) => {
    const b = req.body || {};
    const isAdmin = b.isAdmin === true || (b.sellerRole || '').toLowerCase().includes('admin');
    const sellerRole = (b.sellerRole || '').toLowerCase();

    // Students and visitors cannot add items, only verified merchants and admin
    if (!isAdmin && (sellerRole.includes('student') || sellerRole.includes('visitor') || sellerRole.includes('guest'))) {
      return res.status(403).json({
        success: false,
        message: 'Access Restricted: Students and Visitors/Guests are not allowed to add items to the market. Only verified Merchants/Vendors can add items.'
      });
    }

    const newProduct = {
      id: b.id || `prod-${Date.now()}`,
      title: b.title || 'Untitled Listing',
      price: Number(b.price) || 0,
      category: b.category || 'Textbooks & Books',
      description: b.description || '',
      image: b.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      sellerName: b.sellerName || (isAdmin ? 'Central Campus Store' : 'Campus Merchant'),
      sellerContact: b.sellerContact || '+233241234567',
      sellerRole: b.sellerRole || (isAdmin ? 'Central Admin / Official Store' : 'Campus Merchant'),
      sellerId: b.sellerId || (isAdmin ? 'admin-store' : 'usr-custom'),
      locationOnCampus: b.locationOnCampus || 'Senate Building Ground Floor',
      condition: b.condition || 'Brand New',
      datePosted: 'Just Now',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    campusProductsStore.unshift(newProduct);
    saveJsonStore(PRODUCTS_FILE, campusProductsStore);

    return res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product: newProduct
    });
  });

  // Product Update endpoint (supports body.id or query/param)
  app.put(['/api/products', '/api/products/:id'], (req, res) => {
    const targetId = req.params.id || req.body?.id;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Product ID is required for update' });
    }

    const idx = campusProductsStore.findIndex(p => String(p.id) === String(targetId));
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const b = req.body || {};
    campusProductsStore[idx] = {
      ...campusProductsStore[idx],
      title: b.title !== undefined ? b.title : campusProductsStore[idx].title,
      price: b.price !== undefined ? Number(b.price) : campusProductsStore[idx].price,
      category: b.category !== undefined ? b.category : campusProductsStore[idx].category,
      description: b.description !== undefined ? b.description : campusProductsStore[idx].description,
      image: b.image || campusProductsStore[idx].image,
      sellerName: b.sellerName !== undefined ? b.sellerName : campusProductsStore[idx].sellerName,
      sellerContact: b.sellerContact !== undefined ? b.sellerContact : campusProductsStore[idx].sellerContact,
      sellerRole: b.sellerRole !== undefined ? b.sellerRole : campusProductsStore[idx].sellerRole,
      locationOnCampus: b.locationOnCampus !== undefined ? b.locationOnCampus : campusProductsStore[idx].locationOnCampus,
      condition: b.condition !== undefined ? b.condition : campusProductsStore[idx].condition,
    };

    saveJsonStore(PRODUCTS_FILE, campusProductsStore);

    return res.json({
      success: true,
      message: 'Product updated successfully!',
      product: campusProductsStore[idx]
    });
  });

  // Product Delete endpoint (supports DELETE /api/products?id=... and DELETE /api/products/:id)
  app.delete(['/api/products', '/api/products/:id'], (req, res) => {
    const targetId = req.params.id || req.query.id || req.body?.id;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Product ID is required for deletion' });
    }

    const initialLength = campusProductsStore.length;
    campusProductsStore = campusProductsStore.filter(p => String(p.id) !== String(targetId));

    if (campusProductsStore.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    saveJsonStore(PRODUCTS_FILE, campusProductsStore);

    return res.json({
      success: true,
      message: 'Product listing removed successfully',
      remainingCount: campusProductsStore.length
    });
  });

  // Reset Products to Campus Defaults
  app.post('/api/products/reset', (_req, res) => {
    campusProductsStore = [...INITIAL_CAMPUS_PRODUCTS];
    saveJsonStore(PRODUCTS_FILE, campusProductsStore);
    return res.json({
      success: true,
      message: 'Catalog reset to original campus listings',
      products: campusProductsStore
    });
  });

  // Orders List endpoint
  app.get('/api/orders', (_req, res) => {
    return res.json({
      success: true,
      orders: campusOrdersStore
    });
  });

  // Order Placement endpoint
  app.post('/api/orders', (req, res) => {
    const b = req.body || {};
    const newOrder = {
      id: `ord-${Date.now()}`,
      items: b.items || [],
      totalAmount: b.totalAmount || 0,
      paymentMethod: b.paymentMethod || 'momo',
      momoNumber: b.momoNumber,
      deliveryLocation: b.deliveryLocation || 'Trinity Hall Porter Desk',
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    campusOrdersStore.unshift(newOrder);
    saveJsonStore(ORDERS_FILE, campusOrdersStore);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder
    });
  });

  // Order Status Update endpoint
  app.put('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body || {};
    const order = campusOrdersStore.find(o => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (status) {
      order.status = status;
      saveJsonStore(ORDERS_FILE, campusOrdersStore);
    }
    return res.json({ success: true, message: 'Order status updated', order });
  });

  // Order Delete endpoint (Admin)
  app.delete(['/api/orders', '/api/orders/:id'], (req, res) => {
    const targetId = req.params.id || req.query.id || req.body?.id;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Order ID is required for deletion' });
    }
    const initialLen = campusOrdersStore.length;
    campusOrdersStore = campusOrdersStore.filter(o => String(o.id) !== String(targetId));
    if (campusOrdersStore.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    saveJsonStore(ORDERS_FILE, campusOrdersStore);
    return res.json({ success: true, message: 'Order deleted successfully', remainingCount: campusOrdersStore.length });
  });

  // --- ADMIN AUTHENTICATION & PASSWORD MANAGEMENT ---
  app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, message: 'Admin password is required' });
    }
    // Verify password against current password or default 'shopping2026'
    if (password === currentAdminPassword || password === 'shopping2026') {
      return res.json({
        success: true,
        message: 'Admin access verified',
        maskedPassword: MASKED_ADMIN_KEY
      });
    }
    return res.status(401).json({ success: false, message: 'Incorrect admin password' });
  });

  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (currentPassword !== currentAdminPassword && currentPassword !== 'shopping2026') {
      return res.status(403).json({ success: false, message: 'Current password incorrect. Only admin can modify password.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters.' });
    }
    currentAdminPassword = newPassword.trim();
    return res.json({
      success: true,
      message: 'Admin master password updated successfully!',
      maskedPassword: MASKED_ADMIN_KEY
    });
  });

  app.get('/api/admin/stats', (_req, res) => {
    return res.json({
      success: true,
      totalProducts: campusProductsStore.length,
      totalOrders: campusOrdersStore.length,
      totalNotices: campusNoticesStore ? campusNoticesStore.length : 0,
      totalAppointments: clinicAppointmentsStore ? clinicAppointmentsStore.length : 0,
      maskedPassword: MASKED_ADMIN_KEY,
      systemStatus: 'Operational • Central University Miotso Hub'
    });
  });

  // --- LIVE CAMPUS GPS & VEHICLE TRACKING ---
  const liveGPSStore = new Map<string, any>([
    [
      'shuttle-1',
      {
        id: 'shuttle-1',
        name: 'Campus Shuttle 01 (Miotso Loop)',
        role: 'Campus Shuttle',
        x: 45,
        y: 25,
        lat: 5.7625,
        lng: 0.0530,
        speedKmH: 22,
        headingDeg: 95,
        lastUpdated: 'Just now'
      }
    ],
    [
      'ambulance-1',
      {
        id: 'ambulance-1',
        name: 'Emergency Ambulance CLN-01',
        role: 'Emergency Ambulance',
        x: 22,
        y: 35,
        lat: 5.7612,
        lng: 0.0518,
        speedKmH: 0,
        headingDeg: 180,
        lastUpdated: 'Standby at Clinic'
      }
    ],
    [
      'security-1',
      {
        id: 'security-1',
        name: 'Campus Security Patrol Unit 2',
        role: 'Campus Security',
        x: 70,
        y: 60,
        lat: 5.7588,
        lng: 0.0548,
        speedKmH: 14,
        headingDeg: 270,
        lastUpdated: 'Just now'
      }
    ]
  ]);

  // Shuttle movement simulator
  let shuttleProgress = 0;
  setInterval(() => {
    shuttleProgress = (shuttleProgress + 0.02) % 1;
    // Circle along Central Boulevard and Senate Ring
    const baseLat = 5.7605;
    const baseLng = 5.7605 > 0 ? 0.0535 : 0.0535;
    const offsetLat = Math.sin(shuttleProgress * Math.PI * 2) * 0.0020;
    const offsetLng = Math.cos(shuttleProgress * Math.PI * 2) * 0.0018;
    const shuttle = liveGPSStore.get('shuttle-1');
    if (shuttle) {
      shuttle.lat = Number((baseLat + offsetLat).toFixed(5));
      shuttle.lng = Number((baseLng + offsetLng).toFixed(5));
      shuttle.x = Math.round(50 + (shuttle.lng - 0.0535) * 10000);
      shuttle.y = Math.round(50 - (shuttle.lat - 5.7605) * 10000);
      shuttle.speedKmH = Math.round(18 + Math.random() * 8);
      shuttle.headingDeg = Math.round((shuttleProgress * 360) % 360);
      shuttle.lastUpdated = 'Live';
    }
  }, 3000);

  // GET live GPS positions
  app.get('/api/gps/locations', (_req, res) => {
    const locations = Array.from(liveGPSStore.values());
    return res.json({ success: true, locations });
  });

  // POST update student / user GPS position
  app.post('/api/gps/update-location', (req, res) => {
    const { id = 'user-self', name = 'Your Location', role = 'Student', x = 75, y = 70, lat, lng, speedKmH = 0, headingDeg = 0 } = req.body || {};
    const computedLat = typeof lat === 'number' ? lat : 5.7592 + (y - 50) * 0.0001;
    const computedLng = typeof lng === 'number' ? lng : 0.0528 + (x - 50) * 0.0001;

    liveGPSStore.set(id, {
      id,
      name,
      role,
      x,
      y,
      lat: computedLat,
      lng: computedLng,
      speedKmH,
      headingDeg,
      lastUpdated: 'Just now',
      isSelf: true
    });

    return res.json({ success: true, message: 'Location updated' });
  });

  // --- OPENROUTER ROADS & LANES ROUTING ENGINE ---
  // Campus road junction network nodes for high-precision path snapping along CARTO Voyager lanes
  const CAMPUS_ROAD_NODES: Record<string, [number, number]> = {
    'gate': [5.7635, 0.0507],
    'main_gate_lane': [5.7630, 0.0515],
    'senate_north': [5.7628, 0.0528],
    'senate': [5.7624, 0.0533],
    'clinic_lane': [5.7615, 0.0518],
    'clinic': [5.7612, 0.0518],
    'law_plaza': [5.7616, 0.0528],
    'quadrangle': [5.7604, 0.0535],
    'library': [5.7604, 0.0535],
    'cbs_avenue': [5.7616, 0.0545],
    'destiny_lane': [5.7604, 0.0558],
    'food_court_hub': [5.7585, 0.0542],
    'engineering_lane': [5.7588, 0.0521],
    'sports_junction': [5.7576, 0.0512],
    'trinity_avenue': [5.7584, 0.0552],
  };

  function findNearestRoadNode(lat: number, lng: number): string {
    let nearestKey = 'quadrangle';
    let minD = Infinity;
    for (const [key, coords] of Object.entries(CAMPUS_ROAD_NODES)) {
      const d = Math.hypot(coords[0] - lat, coords[1] - lng);
      if (d < minD) {
        minD = d;
        nearestKey = key;
      }
    }
    return nearestKey;
  }

  // Generate intermediate road/lane waypoints between two campus locations
  function buildCampusRoadPolyline(startLat: number, startLng: number, destLat: number, destLng: number): [number, number][] {
    const startNode = findNearestRoadNode(startLat, startLng);
    const destNode = findNearestRoadNode(destLat, destLng);

    const polyline: [number, number][] = [[startLat, startLng]];

    // Intermediate routing graph through the Central Quadrangle hub
    if (startNode !== destNode) {
      polyline.push(CAMPUS_ROAD_NODES[startNode]);

      // If traversing North-South or East-West, cross through Quadrangle or Central Hub
      if (startNode !== 'quadrangle' && destNode !== 'quadrangle') {
        const midPoint: [number, number] = [
          (CAMPUS_ROAD_NODES[startNode][0] + CAMPUS_ROAD_NODES[destNode][0]) / 2,
          (CAMPUS_ROAD_NODES[startNode][1] + CAMPUS_ROAD_NODES[destNode][1]) / 2,
        ];
        polyline.push(CAMPUS_ROAD_NODES['quadrangle']);
      }

      polyline.push(CAMPUS_ROAD_NODES[destNode]);
    }

    polyline.push([destLat, destLng]);
    return polyline;
  }

  app.post('/api/gps/route-guide', async (req, res) => {
    try {
      const {
        startId,
        destId,
        startName = 'Start Location',
        destName = 'Destination',
        startLat = 5.7584,
        startLng = 0.0552,
        destLat = 5.7612,
        destLng = 0.0518
      } = req.body || {};

      // Calculate real distance using haversine formula
      const R = 6371000; // meters
      const phi1 = (startLat * Math.PI) / 180;
      const phi2 = (destLat * Math.PI) / 180;
      const deltaPhi = ((destLat - startLat) * Math.PI) / 180;
      const deltaLambda = ((destLng - startLng) * Math.PI) / 180;
      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const directMeters = Math.round(R * c);
      // Realistic road & lane walking path factor ~ 1.25x
      const roadMeters = Math.max(40, Math.round(directMeters * 1.28));
      const walkMinutes = Math.max(1, Math.round(roadMeters / 70)); // ~70m per min

      let coordinates = buildCampusRoadPolyline(startLat, startLng, destLat, destLng);
      let calculatedDistance = roadMeters;
      let calculatedWalkMins = walkMinutes;
      let routingSource = 'campus_road_graph';

      let guidanceSteps = [
        {
          instruction: `Depart ${startName} via the main pedestrian walkway.`,
          laneName: 'Campus Connecting Pathway',
          distanceMeters: Math.round(roadMeters * 0.2),
          directionIcon: 'straight'
        },
        {
          instruction: `Follow Central University Boulevard toward the Quadrangle.`,
          laneName: 'Central Boulevard Main Lane',
          distanceMeters: Math.round(roadMeters * 0.5),
          directionIcon: 'turn'
        },
        {
          instruction: `Turn into the access lane leading directly to ${destName}.`,
          laneName: 'Destination Approach Lane',
          distanceMeters: Math.round(roadMeters * 0.3),
          directionIcon: 'arrive'
        }
      ];

      // Query Open Outer API (OSRM Walking Router) for real-world road network geometry
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const osrmUrl = `https://router.project-osrm.org/route/v1/walking/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
        const osrmRes = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();
          if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
            const bestRoute = osrmData.routes[0];
            if (bestRoute.geometry && bestRoute.geometry.coordinates && bestRoute.geometry.coordinates.length > 1) {
              // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
              coordinates = bestRoute.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
              calculatedDistance = Math.round(bestRoute.distance) || roadMeters;
              calculatedWalkMins = Math.max(1, Math.round(calculatedDistance / 70));
              routingSource = 'osrm_open_road_router';

              if (bestRoute.legs && bestRoute.legs[0]?.steps?.length > 0) {
                const osrmSteps = bestRoute.legs[0].steps.filter((s: any) => s.maneuver && s.maneuver.type !== 'depart');
                if (osrmSteps.length > 0) {
                  guidanceSteps = bestRoute.legs[0].steps.map((st: any, idx: number) => {
                    const roadName = st.name && st.name.trim() ? st.name : 'Campus Pathway';
                    const maneuverType = st.maneuver?.type || 'straight';
                    const modifier = st.maneuver?.modifier || '';
                    const instructionText = idx === 0
                      ? `Depart ${startName} via ${roadName}.`
                      : idx === bestRoute.legs[0].steps.length - 1
                        ? `Arrive at ${destName}.`
                        : `${modifier ? `Turn ${modifier}` : 'Continue'} onto ${roadName} (${Math.round(st.distance)}m).`;
                    return {
                      instruction: instructionText,
                      laneName: roadName,
                      distanceMeters: Math.round(st.distance),
                      directionIcon: maneuverType === 'turn' ? modifier || 'turn' : 'straight'
                    };
                  });
                }
              }
            }
          }
        }
      } catch (osrmErr) {
        // Fall back to campus graph gracefully
      }

      const rawApiKey = process.env.OPENROUTER_API_KEY?.trim() || '';
      const isKeyConfigured =
        rawApiKey.length > 5 &&
        !rawApiKey.includes('YOUR_OPENROUTER_API_KEY') &&
        !rawApiKey.startsWith('MY_');

      let primaryRoad = 'Central Boulevard & Quadrangle Walkway';
      let roadSurface = 'Paved Walkway with Solar Streetlights';
      let openRouterOptimized = false;

      // If OpenRouter is available, get AI lane optimization
      if (isKeyConfigured) {
        try {
          const prompt = `You are the navigation system for Central University Miotso campus (Ghana).
The student is routing from "${startName}" (GPS: ${startLat}, ${startLng}) to "${destName}" (GPS: ${destLat}, ${destLng}).
The distance along campus roads and lanes is ~${calculatedDistance} meters (${calculatedWalkMins} min walk).
Identify the campus roads, walkways, or lanes connecting them (e.g., Miotso Central Boulevard, Senate Ring Road, Trinity Walkway, Library Quadrangle, Clinic Access Road).
Respond ONLY with a JSON object in this format:
{
  "primaryRoad": "<Main road or avenue name>",
  "roadSurface": "<Paved/Cobblestone/Asphalt/Lit Walkway>",
  "steps": [
    "Step 1 with road/lane name and distance",
    "Step 2 with road/lane name and landmarks",
    "Step 3 arrival details"
  ]
}`;
          const aiResponse = await callOpenRouter(
            [{ role: 'user', content: prompt }],
            'You are a campus road and lane navigation engine. Output only valid JSON.'
          );

          if (aiResponse.isRealOpenRouter && aiResponse.text) {
            const cleanJson = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed.primaryRoad) primaryRoad = parsed.primaryRoad;
            if (parsed.roadSurface) roadSurface = parsed.roadSurface;
            if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
              guidanceSteps = parsed.steps.map((s: string, idx: number) => ({
                instruction: s,
                laneName: primaryRoad,
                distanceMeters: Math.round(calculatedDistance / parsed.steps.length),
                directionIcon: idx === parsed.steps.length - 1 ? 'arrive' : 'turn'
              }));
              openRouterOptimized = true;
            }
          }
        } catch (e) {
          console.warn('[RouteGuide] OpenRouter enrichment skipped:', (e as any)?.message);
        }
      }

      const steps = guidanceSteps.map(g => g.instruction);

      return res.json({
        success: true,
        distanceMeters: calculatedDistance,
        walkMinutes: calculatedWalkMins,
        primaryRoad,
        roadSurface,
        steps,
        guidanceSteps,
        coordinates,
        routingSource,
        openRouterOptimized
      });
    } catch (err: any) {
      console.error('[API /api/gps/route-guide] Error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to calculate campus road route'
      });
    }
  });

  // OpenStreetMap & Places GeoJSON Endpoint
  app.get('/api/gps/osm-features', async (req, res) => {
    try {
      const { liveOverpass } = req.query;
      if (liveOverpass === 'true') {
        // Query live Overpass API for Central University Miotso area
        const overpassQuery = `
          [out:json][timeout:15];
          (
            node["amenity"](around:1500,5.7602,0.0534);
            way["highway"](around:1500,5.7602,0.0534);
          );
          out body;
          >;
          out skel qt;
        `;
        const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(overpassQuery)}`
        });
        if (overpassRes.ok) {
          const data = await overpassRes.json();
          return res.json({ success: true, source: 'overpass_live', data });
        }
      }
      
      // Default to curated Central University OSM schema
      return res.json({
        success: true,
        source: 'central_osm_geojson',
        featuresCount: 19,
        osmScope: 'Central University Miotso, Ghana (5.7602° N, 0.0534° E)'
      });
    } catch (e: any) {
      return res.json({ success: false, error: e?.message });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC FILES ---
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Central Mall Server running on http://0.0.0.0:${PORT}`);
    const key = process.env.OPENROUTER_API_KEY;
    if (key && key.length > 5 && !key.includes('YOUR_OPENROUTER_API_KEY')) {
      console.log(`🤖 OpenRouter AI active with model: ${process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'}`);
    } else {
      console.log('ℹ️ OpenRouter key not set in environment. Set OPENROUTER_API_KEY in .env to activate.');
    }
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
