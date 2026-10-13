# Central Mall - Central University (Miotso Campus)

A full-stack web application designed for **Central University Ghana (Miotso Main Campus)**. It integrates a **Python 3.10 Backend Engine**, **Live Campus GPS Navigator**, **Universal Search Bar**, **Central Marketplace (Buy/Sell)**, **School Clinic Desk**, and an **AI Assistant**.

---

## 🌟 Key Features

### 1. 🐍 Python 3.10 Backend (`server.py`)
- **Native Python HTTP Server** running on port `8000`.
- Serves live GPS telemetry, campus building search, marketplace items, order processing, and AI integrations.
- Zero extra pip dependencies required — built with Python standard library (`http.server`, `urllib`, `json`).

### 2. 📍 Campus Live GPS Navigator (`GPSView.tsx`)
- **Interactive Campus Map**: Visualizes Senate Building, Trinity Hall, Destiny Hall, Central Library, Law Faculty, Clinic, and Sports Complex.
- **Live Vehicle & Node Tracking**: Live position updates for Campus Shuttles, Emergency Ambulance, and Security Patrols.
- **Turn-by-Turn Route Guidance**: Select start and destination locations to calculate walking distance (meters), estimated walk time (minutes), and directions.
- **Live Walking Simulation**: Test turn-by-turn navigation in real-time on screen.

### 3. 🔍 Universal Campus Search Bar (`DashboardPage.tsx`)
- Instant search across all campus facilities, halls, hostel rooms, facilities, and marketplace listings.
- Real-time dropdown displaying instant matches with quick navigation to GPS locations or shop items.

### 4. 🛒 Central Marketplace (`ShopView.tsx`)
- Buy & sell textbooks, electronics, campus fashion, food, and hostel appliances.
- Ghana Payment Integration: **MTN MoMo** and **Telecel Cash** payment checkout flow.

### 5. 🏥 School Clinic Desk (`ClinicView.tsx`)
- 24/7 Medical advice, health symptom triage, consultation booking, and one-click emergency ambulance dispatch (+233 30 393 0000).

---

## 🏗️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   React 18 + Vite Frontend │
                          │   (Tailwind CSS + Motion) │
                          └─────────────┬─────────────┘
                                        │ (Port 3000)
                                        ▼
                          ┌───────────────────────────┐
                          │    Node Express Server    │
                          │        (server.ts)        │
                          └─────────────┬─────────────┘
                                        │ Proxy /api/*
                                        ▼
                          ┌───────────────────────────┐
                          │   Python 3.10 Backend     │
                          │        (server.py)        │
                          └───────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Motion (`motion/react`).
- **Middleware Proxy**: Express (`server.ts`) listens on `0.0.0.0:3000` and automatically spawns and proxies `/api/*` calls to the Python HTTP Server on `127.0.0.1:8000`.
- **Backend API**: Python 3.10 (`server.py`) serving endpoints for `/api/gps/locations`, `/api/gps/search`, `/api/products`, `/api/orders`, and `/api/ai/chat`.

---

## 🚀 How to Run the Application

### Prerequisites

- **Node.js**: `v18.x` or higher
- **Python**: `3.10` or higher
- **npm** or **bun**

---

### Step 1: Install Dependencies

```bash
npm install
```

---

### Step 2: Set Environment Variables (Optional)

Create a `.env` file or export the environment variable if you want to use live Google Gemini AI capabilities:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: If no API key is provided, the Python backend automatically provides contextual fallback campus guidance.)*

---

### Step 3: Start Development Mode

Run the development command:

```bash
npm run dev
```

This single command will:
1. Boot `server.ts` on port `3000`.
2. Automatically spawn `server.py` on port `8000`.
3. Serve the Vite React frontend on port `3000`.

Open your browser and navigate to:
```
http://localhost:3000
```

---

### Step 4: Build for Production

To build the compiled output for deployment:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status check |
| `GET` | `/api/gps/locations` | Fetch live GPS coordinates for campus nodes |
| `POST` | `/api/gps/update-location` | Register or update live user location |
| `GET` | `/api/gps/search?q={query}` | Universal search across buildings & marketplace |
| `GET` | `/api/products` | Retrieve all marketplace listings |
| `POST` | `/api/products` | Publish a new item to sell |
| `POST` | `/api/orders` | Submit a new order (MTN MoMo / Telecel) |
| `POST` | `/api/clinic/chat` | Triage health symptoms & emergency guidance |
| `POST` | `/api/ai/chat` | Central AI Assistant endpoint |

---

## 🎓 Campus Location Codes
- **SEN-01**: Senate Building & Admin Block
- **TRN-H1**: Trinity Hall (Male Hostel)
- **DST-H2**: Destiny Hall (Female Hostel)
- **LIB-01**: Central Main Library
- **CLN-01**: School Clinic & Emergency Bay
- **LAW-01**: Law Faculty & Moot Court
- **SPT-01**: Miotso Sports Complex

---

## 📄 License
Created for Central University Ghana (Miotso Campus).
