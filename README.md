# SthaniyaVendor - Hyperlocal Vendor Portal 🛍️

SthaniyaVendor is a full-stack hyperlocal commerce platform that bridges the gap between local brick-and-mortar vendors and digital commerce. The vendor web dashboard (React + Vite) lets shop owners register via phone/JWT auth, manage inventory using Hinglish voice input powered by Gemini AI, scan product barcodes via Open Food Facts, and identify products through in-browser TensorFlow.js image recognition — all without server latency. The POS generates dynamic UPI QR codes (Google Pay, PhonePe, Paytm) and shares digital receipts via WhatsApp. A companion React Native/Expo mobile app gives local buyers an offline-first map to discover nearby stores even in low-connectivity areas. Backend built with Python, FastAPI, and PostgreSQL.
---

## 🌟 Key Features

### Vendor Dashboard (Web App)
- **Fast Registration**: Phone and password-based JWT authentication. No complex email verifications required.
- **Store Configuration**: Vendors can manage their Store Name, Category, Location, and UPI Payment ID directly from the Dashboard Settings.
- **Instant POS & Billing**: Generate digital receipts instantly. 
- **Dynamic UPI QR Integration**: The POS auto-generates a UPI QR code mapped specifically to the vendor's registered bank UPI ID (supports Google Pay, PhonePe, Paytm, etc.).
- **WhatsApp Sharing**: Share digital receipts directly to customers via WhatsApp.

### 🤖 AI-Powered Inventory Management
- **Voice Input (Hinglish Support)**: "Ek kilo chawal 50 rupay" — Vendors can add inventory by simply speaking into the microphone, powered by the Gemini AI API.
- **In-Browser Image Recognition**: Snap a photo of a product, and the built-in TensorFlow.js MobileNet model (optimized for speed) instantly identifies it without server latency.
- **Barcode Scanner**: Scan product barcodes to automatically fetch the product name and brand via the Open Food Facts API.

### Buyer Discovery (Mobile App)
- **React Native / Expo App**: A robust mobile application for local buyers.
- **Offline-First Maps**: Integrated with `AsyncStorage` to cache store locations, allowing buyers to navigate to stores even in low-connectivity areas.

---

## 🛠️ Tech Stack

**Backend:**
- Python & FastAPI
- PostgreSQL (Database)
- PyJWT (Authentication)

**Web Frontend:**
- React 18 & Vite
- Lucide React (Icons)
- Vanilla CSS (Glassmorphism & Modern UI)
- TensorFlow.js (Client-side AI)

**Mobile App:**
- React Native (Expo)
- Expo Router
- React Native Maps

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL database running locally or in the cloud.

### 1. Setting up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your `.env` file (see `.env.example`):
   ```env
   DATABASE_URL=postgresql://user:password@localhost/vendorlink
   SECRET_KEY=your_jwt_secret
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The database schema will automatically initialize on startup.*

### 2. Setting up the Web Dashboard
1. Navigate to the web directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: Use `127.0.0.1` instead of `localhost` on Windows to avoid IPv6 fetch issues).*
4. Run the development server:
   ```bash
   npm run dev
   ```

### 3. Setting up the Mobile App
1. Navigate to the project root:
   ```bash
   cd .
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```

---

## 💳 Testing UPI Payments
When testing the POS Bill Generator, ensure you go to the **Settings** tab in your Vendor Dashboard and enter a valid UPI format (e.g., `yournumber@paytm` or `name@okicici`). Standard phone numbers without the banking suffix will be rejected by apps like Google Pay when the QR is scanned.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
