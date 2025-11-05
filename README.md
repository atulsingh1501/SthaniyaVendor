# 🛍️ Local Store — Hyperlocal Discovery & Vendor Management App

A **React Native (Expo)** mobile app that connects local buyers with nearby vendors — built with a map-first experience, real-time inventory, and AI-powered features.

---

## 📱 What It Does

**For Buyers:**
- Browse local stores on an interactive map with category filters
- Search stores and products (text + 🎙️ voice)
- Get in-app walking/driving directions to any store
- View store inventory, ratings, and contact info

**For Vendors:**
- Register and manage your store
- List products with stock toggle
- Add products using 📸 camera (barcode scan / AI image recognition)
- 🎙️ Speak to add products via voice
- Generate and send itemized 🧾 bills to customers (print or WhatsApp)

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native (Expo SDK 54, Expo Router) |
| Language | TypeScript |
| Backend / Database | Supabase (Postgres, Auth, Storage, Realtime) |
| Maps | React Native Maps + Google Maps API |
| Speech Recognition | `expo-speech-recognition` (native Android/iOS) |
| Computer Vision | Gemini Vision API + `expo-camera` |
| Barcode Scanning | `expo-camera` (built-in scanner) |
| Bill Generation | `expo-print` + `react-native-html-to-pdf` |
| NLP Parsing | Gemini Flash API (structured extraction) |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create a `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start the app
```bash
npx expo start
```

Open in:
- **Android emulator** (recommended)
- **iOS simulator**
- **Expo Go** (limited — native modules may require a dev build)

---

## 📁 Project Structure

```
app/
  (tabs)/
    index.tsx       # Buyer home (map + search + store popup)
    vendor.tsx      # Vendor dashboard (products, stock, bill)
  vendor-setup/     # Vendor onboarding flow
  store/            # Store detail page
utils/
  supabase.ts       # Supabase client
components/         # Shared UI components
```

---

## 🗺️ Feature Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full detailed plan.

| Phase | Feature | Status |
|---|---|---|
| ✅ Phase 1 | Map + store discovery, vendor dashboard, auth | **Done** |
| 🔜 Phase 2 | 🎙️ Voice search (buyer) | Planned |
| 🔜 Phase 2 | 📸 Barcode + AI product listing (vendor) | Planned |
| 🔜 Phase 2 | 🎙️ Voice add product (vendor) | Planned |
| 🔜 Phase 2 | 🧾 Bill generation (print + WhatsApp send) | Planned |
| 🔮 Phase 3 | Footfall analytics, visibility boost, GNN recommendations | Future |

---

## 🧠 AI-Powered Features (Phase 2)

All AI features are designed to run **without a dedicated ML backend**:

- **Voice Search / Voice Add Product** → Native device speech APIs (`expo-speech-recognition`)
- **Barcode Scanning** → Open Food Facts public API (free, no auth)
- **Product Image Recognition** → Gemini 1.5 Flash Vision API (REST from app)
- **NLP Text Parsing** → Gemini Flash (e.g., "Add 1kg rice, ₹120" → structured JSON)

> 💡 No FastAPI or ML server required. Supabase stays as the sole backend.

---

## 🗃️ Database Schema (Supabase)

```sql
-- Core tables
stores (id, vendor_id, name, category, latitude, longitude, phone, rating)
products (id, store_id, name, price, unit, is_in_stock)

-- Phase 2 addition
bills (id, store_id, customer_phone, customer_name, items JSONB, total, pdf_url, created_at)
```

---

## 📦 Key Dependencies

```json
"@supabase/supabase-js": "^2.x",
"expo-location": "^55.x",
"react-native-maps": "^1.x",
"react-native-maps-directions": "^1.x",
"expo-speech-recognition": "TBD",
"expo-camera": "TBD",
"expo-print": "TBD",
"expo-sharing": "TBD"
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/voice-search`
3. Commit and push your changes
4. Open a Pull Request

---

*Built with ❤️ for India's local vendor ecosystem.*
