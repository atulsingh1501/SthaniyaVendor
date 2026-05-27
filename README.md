# SthaniyaVendor — Hyperlocal Vendor Portal 🛍️

> **Empowering local shop owners with AI-powered digital commerce tools — from voice-based inventory to UPI billing and offline buyer discovery.**

SthaniyaVendor is a production-ready, full-stack hyperlocal commerce platform that bridges the gap between local brick-and-mortar vendors and the digital economy. It gives small shop owners an easy-to-use web dashboard with AI tools, instant UPI billing, and a companion mobile app for buyers to discover nearby stores — even offline.

[![TypeScript](https://img.shields.io/badge/TypeScript-70.8%25-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Web Dashboard Setup](#2-web-dashboard-setup)
  - [Mobile App Setup](#3-mobile-app-setup)
- [Environment Variables](#-environment-variables)
- [Feature Deep Dive](#-feature-deep-dive)
- [Testing UPI Payments](#-testing-upi-payments)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

India has millions of local kirana stores, vegetable vendors, and small shop owners who lack the digital infrastructure to compete with large e-commerce platforms. **SthaniyaVendor** solves this by providing:

- A **web dashboard** for vendors to manage their store, inventory, and billing — in English or Hinglish
- **AI tools** that let non-tech-savvy vendors use voice, camera, or barcode to manage stock
- An **Expo mobile app** for buyers to find local stores on a map — even without internet

The name *Sthaniya* (स्थानीय) means **"local"** in Hindi — a reflection of the platform's core mission.

---

## ✨ Key Features

### 🖥️ Vendor Dashboard (Web App)

| Feature | Description |
|---|---|
| **Phone-based Auth** | JWT authentication via phone number — no email verification friction |
| **Store Configuration** | Manage store name, category, location, and UPI ID from the Settings tab |
| **Instant POS & Billing** | Generate itemized digital receipts in seconds |
| **Dynamic UPI QR** | Auto-generates a UPI QR code tied to the vendor's registered bank ID (GPay, PhonePe, Paytm) |
| **WhatsApp Receipt Sharing** | Send digital bills directly to customers via WhatsApp with one tap |
| **Inventory Dashboard** | Full inventory view with add, edit, and delete support |

---

### 🤖 AI-Powered Inventory Management

#### 🎙️ Voice Input — Hinglish Support
Vendors can add items to inventory just by speaking naturally in Hindi or English:
> *"Ek kilo chawal 50 rupay"* → Adds **Rice, 1 kg, ₹50** to inventory

Powered by the **Gemini AI API**, the system understands mixed-language input and parses it into structured product data automatically.

#### 📷 In-Browser Image Recognition
Point the camera at any product and the app identifies it instantly — no upload, no server round trip. Uses a **TensorFlow.js MobileNet** model running entirely in the browser, optimized for low-end devices.

#### 🔢 Barcode Scanner
Scan any product barcode to automatically retrieve the product name, brand, and category via the **Open Food Facts API** — ideal for packaged goods and FMCG products.

---

### 📱 Buyer Discovery (Mobile App)

| Feature | Description |
|---|---|
| **Store Map** | Interactive map showing nearby registered vendors |
| **Offline-First** | Store locations cached via `AsyncStorage` — works in low-connectivity areas |
| **Category Filter** | Filter stores by category (grocery, vegetables, pharmacy, etc.) |
| **Navigation Ready** | Tap a store pin to get directions |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.9+** | Core backend language |
| **FastAPI** | REST API framework with auto-generated docs |
| **PostgreSQL** | Primary relational database |
| **PyJWT** | Stateless JWT authentication |
| **Uvicorn** | ASGI server |

### Web Frontend
| Technology | Purpose |
|---|---|
| **React 18 + Vite** | Fast SPA with hot module replacement |
| **TypeScript** | Type-safe codebase |
| **TensorFlow.js** | In-browser AI for image recognition |
| **Lucide React** | Icon library |
| **Vanilla CSS** | Glassmorphism-inspired modern UI |

### Mobile App
| Technology | Purpose |
|---|---|
| **React Native (Expo)** | Cross-platform mobile app |
| **Expo Router** | File-based navigation |
| **React Native Maps** | Interactive store discovery map |
| **AsyncStorage** | Offline-first data caching |

### External APIs & Services
| Service | Purpose |
|---|---|
| **Gemini AI API** | Voice/text inventory parsing (Hinglish) |
| **Open Food Facts API** | Barcode product lookup |
| **UPI Deep Link** | Dynamic QR code generation for payments |

---

## 📁 Project Structure

```
SthaniyaVendor/
├── backend/                   # Python FastAPI server
│   ├── main.py                # App entry point + DB init
│   ├── routers/               # Route handlers (auth, vendors, inventory)
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic request/response schemas
│   ├── auth.py                # JWT logic
│   └── requirements.txt
│
├── web/                       # React + Vite vendor dashboard
│   ├── src/
│   │   ├── pages/             # Dashboard, POS, Inventory, Settings
│   │   ├── components/        # Reusable UI (QR modal, receipt, scanner)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # API helpers, formatters
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── app/                       # React Native / Expo buyer app
│   ├── (tabs)/                # Tab-based navigation screens
│   ├── components/            # Map, store card, filter bar
│   └── utils/                 # Offline cache helpers
│
├── components/                # Shared component library
├── constants/                 # App-wide constants
├── hooks/                     # Shared hooks
├── assets/images/             # App icons and images
├── scripts/                   # Utility scripts
├── .env                       # Environment variables
├── app.json                   # Expo config
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+ → [Download](https://nodejs.org/)
- **Python** 3.9+ → [Download](https://www.python.org/)
- **PostgreSQL** (local or cloud like Neon/Supabase) → [Download](https://www.postgresql.org/)
- **Expo CLI** → `npm install -g expo-cli`

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret (see Environment Variables section)

# Start the FastAPI development server
uvicorn main:app --reload --port 8000
```

> ✅ The database schema auto-initializes on first startup. No manual migrations needed.

The API will be running at `http://127.0.0.1:8000`
Interactive API docs available at `http://127.0.0.1:8000/docs`

---

### 2. Web Dashboard Setup

```bash
# Navigate to the web frontend directory
cd web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your VITE_API_URL and VITE_GEMINI_API_KEY (see below)

# Start the development server
npm run dev
```

> ⚠️ **Windows users**: Use `VITE_API_URL=http://127.0.0.1:8000` (not `localhost`) to avoid IPv6 resolution issues.

The dashboard will be available at `http://localhost:5173`

---

### 3. Mobile App Setup

```bash
# From the project root
npm install

# Start the Expo development server
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone, or press:
- `a` to open on Android emulator
- `i` to open on iOS simulator

---

## 🔐 Environment Variables

### `backend/.env`

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/sthaniyavendor

# JWT secret key — use a long, random string in production
SECRET_KEY=your_super_secret_jwt_key_here
```

### `web/.env`

```env
# Backend API URL
VITE_API_URL=http://127.0.0.1:8000

# Gemini AI API key (for voice inventory input)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> 🔒 Never commit `.env` files to version control. Both are already listed in `.gitignore`.

---

## 🔍 Feature Deep Dive

### Voice Inventory Flow
1. Vendor taps the microphone button on the Inventory page
2. Speaks naturally: *"Panch kilo aata, ek sau rupay"*
3. Audio is sent to Gemini AI, which parses it as: `{ name: "Aata", quantity: 5, unit: "kg", price: 100 }`
4. A pre-filled form appears for the vendor to confirm or edit
5. Item is saved to the database on confirmation

### UPI QR Billing Flow
1. Vendor adds items to a bill in the POS screen
2. On clicking "Generate Bill", a UPI deep link is constructed using the vendor's registered UPI ID
3. A QR code is rendered in real time — customers can scan it directly with any UPI app
4. Receipt can be shared to the customer's WhatsApp via a pre-formatted message link

### Offline-First Map (Mobile)
1. On first load, the app fetches all registered store locations from the backend
2. Stores are saved to `AsyncStorage` with a timestamp
3. On subsequent loads (or when offline), the cached data is served from local storage
4. Map renders normally — buyers can still find and navigate to stores without internet

---

## 💳 Testing UPI Payments

When testing the POS Bill Generator, make sure you:

1. Go to the **Settings** tab in the Vendor Dashboard
2. Enter a valid UPI ID in the format:
   - `yournumber@paytm`
   - `name@okicici`
   - `phonenumber@ybl` (PhonePe)
   - `phonenumber@oksbi`

> ⚠️ Plain phone numbers (without the `@bank` suffix) will be rejected by UPI apps like Google Pay when the QR is scanned.

---

## 🗺️ Roadmap

- [ ] Vendor analytics dashboard (daily/weekly sales charts)
- [ ] Multi-language support (Tamil, Telugu, Marathi)
- [ ] Customer-facing product catalog page per store
- [ ] Push notifications for low stock alerts
- [ ] Integration with India Post / delivery partners
- [ ] Admin panel for platform management

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*Built with ❤️ for India's local vendors — **Apna dukaan, digital bano.***
