# 🗺️ Local Vendor App — Feature Roadmap (AI Reference)

> **Purpose:** This file is a living reference for the AI assistant to track planned features, tech decisions, and implementation guidance. Update this file as features are built.

---

## 🏗️ Current Stack (Phase 1 — Done)

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo Router, SDK 54) |
| Backend / DB | Supabase (Postgres + Auth + Realtime) |
| Maps | React Native Maps + Google Maps API |
| Navigation | React Native Maps Directions |
| Language | TypeScript |

### Key Screens
- `app/(tabs)/index.tsx` — **Buyer Home**: Map view, store markers, search bar, category chips, store popup card with directions
- `app/(tabs)/vendor.tsx` — **Vendor Dashboard**: Product list, stock toggle, logout, add product (stub)
- `app/vendor-setup/` — **Vendor Onboarding**: Store registration flow
- `app/store/` — **Store Detail Screen**: View store products

---

## 🔜 Phase 2 — Planned Features

---

### 🎙️ Feature 1: Natural Speech Recognition for Search (Buyer)

**Goal:** Let buyers speak their search query instead of typing (e.g., "show me grocery stores near me").

**Where to integrate:** `app/(tabs)/index.tsx` — next to the existing `TextInput` search bar.

**Architecture:**
- React Native app captures audio using `expo-av` or `expo-speech-recognition`
- Audio is sent to the **FastAPI backend** as a WAV/m4a file (multipart form)
- FastAPI runs **OpenAI Whisper** (open-source, self-hosted) to transcribe
- Transcribed text is returned → populates `searchQuery` state → filters stores/products

**Model:** `openai/whisper-base` or `whisper-small` (via `faster-whisper` for speed)
```python
# FastAPI endpoint
@app.post("/transcribe")
async def transcribe(audio: UploadFile):
    # faster-whisper inference
    segments, _ = whisper_model.transcribe(audio_path, language="hi")  # supports Hindi too!
    return {"text": " ".join([s.text for s in segments])}
```

**Libraries (FastAPI side):**
- `faster-whisper` — optimized Whisper inference (CTranslate2 backend)
- `ffmpeg-python` — audio format conversion

**Implementation Notes:**
- Add a mic button icon in the search bar
- Record audio in-app → send to FastAPI → get transcript → filter
- Handle permission: `android.permission.RECORD_AUDIO`
- Whisper supports Indian English (`en`) and Hindi (`hi`) natively
- Use `whisper-base` for speed on CPU; `whisper-small` if GPU available

---

### 🎙️ Feature 2: Natural Speech Recognition for Adding Products (Vendor)

**Goal:** Let vendors say "Add 1kg Basmati Rice, price 120 rupees" and have it auto-fill the product form.

**Where to integrate:** `app/(tabs)/vendor.tsx` — Add Product flow / modal.

**Architecture:**
- Same Whisper `/transcribe` endpoint → get raw text
- Then send text to a second FastAPI endpoint `/parse-product`
- NLP model extracts entities: `{ name, unit, price, category }`

**NLP Model Options:**
- **Option A (Recommended for MVP):** `spaCy` with a custom trained NER model on product vocabulary
- **Option B:** Fine-tuned `distilBERT` or `bert-base` on a product entity dataset
- **Option C:** Rule-based regex pipeline (fastest to ship, ~85% accuracy for simple patterns)

```python
# FastAPI endpoint
@app.post("/parse-product")
async def parse_product(data: dict):
    text = data["text"]
    # spaCy or regex extraction
    result = extract_product_entities(text)
    # returns: { "name": "Basmati Rice", "unit": "1kg", "price": 120 }
    return result
```

**Implementation Notes:**
- Mic button on Add Product screen
- Speech → `/transcribe` → `/parse-product` → auto-fill form fields
- Allow vendor to review/edit before saving to Supabase

---

### 📸 Feature 3: CV-Based Product Listing (Vendor)

**Goal:** Vendor points camera at a product or its label and the app auto-fills product name, price suggestion, and category.

**Where to integrate:** `app/(tabs)/vendor.tsx` — Add Product modal.

**Architecture:**
- Vendor captures image via `expo-camera`
- Image sent as base64/multipart to FastAPI `/identify-product`
- FastAPI runs a pre-trained vision model to identify the product
- Returns: `{ name, category, confidence }`

**Two CV Modes:**

#### Mode A: Barcode Scanning (Easy + Accurate)
- Scan barcode client-side using `expo-camera` (built-in ZXing/MLKit)
- Send barcode number to FastAPI `/barcode-lookup`
- FastAPI queries a **local SQLite/Postgres product database** seeded from Open Food Facts dump (no live API call)
- Returns product info instantly

#### Mode B: Product Image Recognition (CV Model)
- Model: **CLIP (OpenAI)** — `openai/clip-vit-base-patch32` via HuggingFace `transformers`
- Zero-shot classification against a list of product categories
- OR: **BLIP-2** for image captioning → extract product name from caption
- OR: **YOLOv8** fine-tuned on product images for direct detection

```python
# FastAPI endpoint
@app.post("/identify-product")
async def identify_product(image: UploadFile):
    img = load_image(image)
    # CLIP zero-shot classification
    inputs = processor(text=PRODUCT_CATEGORIES, images=img, return_tensors="pt")
    logits = model(**inputs).logits_per_image
    best_match = PRODUCT_CATEGORIES[logits.argmax()]
    return {"name": best_match, "confidence": float(logits.softmax(dim=1).max())}
```

**Libraries (FastAPI side):**
- `transformers` — HuggingFace CLIP/BLIP-2
- `torch` — model inference
- `Pillow` — image processing
- `ultralytics` — if using YOLOv8

**Mobile side:**
- `expo-camera` — live camera + barcode scanning
- `expo-image-picker` — gallery upload fallback

---

### 🧾 Feature 4: Vendor Bill Generation & Delivery

**Goal:** Vendor selects products + quantities → generates a bill → prints it or sends to the user.

**Where to integrate:** New screen/modal from `app/(tabs)/vendor.tsx`.

**Bill Generation (client-side — no FastAPI needed here):**
- Library: `react-native-html-to-pdf` — build HTML bill template → convert to PDF
- Library: `expo-print` — native print dialog
- Library: `expo-sharing` — share PDF via WhatsApp/email

**Sending to User:**
- **Option A: WhatsApp** — `Linking.openURL('whatsapp://send?phone=...')` after sharing PDF
- **Option B: Supabase Storage** — Upload PDF → get public URL → send as message/notification

**Data Model Additions (Supabase):**
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  customer_phone TEXT,
  customer_name TEXT,
  items JSONB,  -- [{product_id, name, qty, unit, price}]
  total NUMERIC,
  created_at TIMESTAMP DEFAULT now(),
  pdf_url TEXT  -- Supabase storage link
);
```

---

## 🐍 FastAPI Backend — Structure

The FastAPI server is a **separate Python service** running alongside Supabase.

```
fastapi-backend/
  main.py                  # App entry + route registration
  routers/
    speech.py              # /transcribe (Whisper)
    nlp.py                 # /parse-product (spaCy/regex NER)
    vision.py              # /identify-product (CLIP/BLIP)
    barcode.py             # /barcode-lookup (local DB)
  models/
    whisper_model.py       # Whisper loader (faster-whisper)
    clip_model.py          # CLIP loader (transformers)
    nlp_model.py           # spaCy pipeline loader
  utils/
    audio.py               # Audio format conversion
    image.py               # Image preprocessing
  requirements.txt
  Dockerfile               # For deployment
```

**Key endpoints:**

| Method | Endpoint | Model | Purpose |
|---|---|---|---|
| POST | `/transcribe` | Whisper (faster-whisper) | Audio → text |
| POST | `/parse-product` | spaCy NER / regex | Text → product JSON |
| POST | `/identify-product` | CLIP / BLIP-2 | Image → product name |
| GET | `/barcode-lookup/{barcode}` | Local DB | Barcode → product info |

**Requirements:**
```
fastapi
uvicorn
faster-whisper
transformers
torch
Pillow
spacy
ffmpeg-python
python-multipart
```

---

## 🏛️ Full Architecture

```
React Native App (Expo)
        │
        ├── Supabase ──────── Auth, Postgres DB, Storage (bills PDF)
        │
        └── FastAPI (Python) ── ML Inference Server
                ├── Whisper ──── Speech recognition (buyer + vendor)
                ├── spaCy ────── Product entity extraction
                ├── CLIP/BLIP ── Product image recognition
                └── Local DB ─── Barcode → product lookup
```

---

## 📦 Full Library Install Plan

**React Native / Expo:**
```bash
npx expo install expo-av              # Audio recording for speech
npx expo install expo-camera          # Camera + barcode scanning
npx expo install expo-image-picker    # Gallery fallback
npx expo install expo-print           # Print bills
npx expo install expo-sharing         # Share PDF
npm install react-native-html-to-pdf  # HTML → PDF bill
```

**FastAPI Python backend:**
```bash
pip install fastapi uvicorn faster-whisper transformers torch \
            Pillow spacy ffmpeg-python python-multipart
python -m spacy download en_core_web_sm
```

**Environment variables:**
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_FASTAPI_URL=http://<your-server-ip>:8000
```

---

## 🗓️ Implementation Order (Suggested)

| Priority | Feature | Effort |
|---|---|---|
| 1 | 🐍 FastAPI server setup + Whisper | Medium — boilerplate + model loading |
| 2 | 🎙️ Voice search (Buyer) | Low — plug audio into search |
| 3 | 📸 Barcode lookup (Vendor add product) | Medium — expo-camera + local DB |
| 4 | 🎙️ Voice add product (Vendor) | Medium — Whisper + spaCy NER |
| 5 | 📷 Image recognition CLIP (Vendor) | Medium — CLIP zero-shot |
| 6 | 🧾 Bill generation + print | Medium — HTML template + expo-print |
| 7 | 📤 Bill send to user (WhatsApp) | Low — expo-sharing + Linking |

---

## 📌 Notes for AI

- **FastAPI is required** — all ML inference (Whisper, CLIP, spaCy) runs on the FastAPI server. Do NOT use external paid APIs.
- All models are **pre-trained open-source** — no fine-tuning required for MVP.
- Supabase remains the DB/Auth/Storage backend. FastAPI is ML-only, not a DB replacement.
- Keep Supabase as the sole database. FastAPI reads/writes to Supabase only when needed (e.g., storing transcription logs).
- The FastAPI server URL is exposed via `EXPO_PUBLIC_FASTAPI_URL` env var.
- The app's primary color is `#0F6E56` (dark teal/green). Maintain this in new UI.
- Support both light and dark mode (use `useColorScheme()` pattern from `index.tsx`).
- All new screens follow Expo Router file-based routing.
- Prefer `faster-whisper` over `openai-whisper` — it's 4x faster on CPU.
