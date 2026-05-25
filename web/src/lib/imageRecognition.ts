/**
 * imageRecognition.ts
 * Client-side product recognition using TensorFlow.js + MobileNet.
 * No API key required — model runs entirely in the browser.
 * Optionally upgrades to Gemini Vision if VITE_GEMINI_API_KEY is set.
 */

// MUST import the full TF.js package first — this registers WebGL + CPU backends
import '@tensorflow/tfjs';
import type * as mobilenetType from '@tensorflow-models/mobilenet';

let mobilenetModel: any = null;
let modelLoading = false;
let modelLoadCallbacks: Array<() => void> = [];

export type RecognitionResult = {
  name: string;
  category: string;
  confidence: string;
  price_hint: string;
  source: 'mobilenet' | 'gemini';
};

// Category mapping from MobileNet labels to store categories
const CATEGORY_MAP: Record<string, { category: string; price_hint: string }> = {
  // Food & Grocery
  banana: { category: 'Grocery', price_hint: '₹40-60/dozen' },
  apple: { category: 'Grocery', price_hint: '₹80-120/kg' },
  orange: { category: 'Grocery', price_hint: '₹60-100/kg' },
  lemon: { category: 'Grocery', price_hint: '₹20-40/piece' },
  broccoli: { category: 'Grocery', price_hint: '₹40-80/piece' },
  carrot: { category: 'Grocery', price_hint: '₹30-50/kg' },
  'hot dog': { category: 'Grocery', price_hint: '₹30-50/piece' },
  pizza: { category: 'Grocery', price_hint: '₹150-300/piece' },
  bread: { category: 'Grocery', price_hint: '₹30-50/piece' },
  cake: { category: 'Grocery', price_hint: '₹200-500/piece' },
  rice: { category: 'Grocery', price_hint: '₹60-120/kg' },
  milk: { category: 'Grocery', price_hint: '₹25-35/L' },
  egg: { category: 'Grocery', price_hint: '₹6-8/piece' },
  // Pharmacy
  pill: { category: 'Pharmacy', price_hint: '₹10-50/strip' },
  capsule: { category: 'Pharmacy', price_hint: '₹10-50/strip' },
  'medicine bottle': { category: 'Pharmacy', price_hint: '₹50-200/bottle' },
  syringe: { category: 'Pharmacy', price_hint: '₹5-15/piece' },
  // Electronics
  laptop: { category: 'Electronics', price_hint: '₹30,000-80,000' },
  'cell phone': { category: 'Electronics', price_hint: '₹5,000-50,000' },
  keyboard: { category: 'Electronics', price_hint: '₹500-3,000' },
  mouse: { category: 'Electronics', price_hint: '₹200-2,000' },
  monitor: { category: 'Electronics', price_hint: '₹8,000-30,000' },
  headphones: { category: 'Electronics', price_hint: '₹500-5,000' },
  television: { category: 'Electronics', price_hint: '₹15,000-80,000' },
  remote: { category: 'Electronics', price_hint: '₹100-500' },
  // Clothing
  'T-shirt': { category: 'Clothing', price_hint: '₹200-800' },
  jersey: { category: 'Clothing', price_hint: '₹300-1,000' },
  jeans: { category: 'Clothing', price_hint: '₹500-2,000' },
  suit: { category: 'Clothing', price_hint: '₹2,000-10,000' },
  shoe: { category: 'Clothing', price_hint: '₹300-3,000' },
  sandal: { category: 'Clothing', price_hint: '₹150-1,000' },
  tie: { category: 'Clothing', price_hint: '₹200-800' },
  // Accessories
  sunglasses: { category: 'Accessories', price_hint: '₹200-2,000' },
  watch: { category: 'Accessories', price_hint: '₹500-10,000' },
  backpack: { category: 'Accessories', price_hint: '₹300-2,000' },
  handbag: { category: 'Accessories', price_hint: '₹300-3,000' },
  umbrella: { category: 'Accessories', price_hint: '₹100-500' },
  necklace: { category: 'Accessories', price_hint: '₹100-1,000' },
  ring: { category: 'Accessories', price_hint: '₹100-2,000' },
};

function mapToCategory(label: string): { category: string; price_hint: string } {
  const lower = label.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { category: 'Other', price_hint: '' };
}

function cleanLabel(label: string): string {
  const parts = label.split(',').map(s => s.trim().replace(/\b\w/g, (c) => c.toUpperCase()));
  
  // ImageNet class 'n03595614' is "jersey, T-shirt, tee shirt"
  // Prefer T-Shirt over Jersey if it's in the list
  if (parts.includes('T-Shirt') || parts.includes('Tee Shirt')) {
    return 'T-Shirt';
  }
  
  // Default: take the first part
  return parts[0];
}

/** Preload the model in the background so it's instant when clicked */
export function preloadImageModel() {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    loadMobileNet().catch(() => {}); // silently preload
  }
}


async function loadMobileNet(): Promise<any> {
  if (mobilenetModel) return mobilenetModel;

  if (modelLoading) {
    return new Promise((resolve) => {
      modelLoadCallbacks.push(() => resolve(mobilenetModel));
    });
  }

  modelLoading = true;
  // Dynamic import — @tensorflow/tfjs at top already registered backends
  const [mobilenet] = await Promise.all([
    import('@tensorflow-models/mobilenet'),
    import('@tensorflow/tfjs'), // ensure backends loaded
  ]);
  mobilenetModel = await mobilenet.load({ version: 1, alpha: 0.25 });
  modelLoading = false;
  modelLoadCallbacks.forEach((cb) => cb());
  modelLoadCallbacks = [];
  return mobilenetModel;
}

/** Classify image using TensorFlow.js MobileNet (no API key required) */
async function recognizeWithMobileNet(imageEl: HTMLImageElement): Promise<RecognitionResult> {
  const model = await loadMobileNet();
  const predictions = await model.classify(imageEl, 3);

  if (!predictions || predictions.length === 0) {
    throw new Error('Could not classify image');
  }

  const top = predictions[0];
  const name = cleanLabel(top.className);
  const confidence = `${Math.round(top.probability * 100)}%`;
  const { category, price_hint } = mapToCategory(top.className);

  return { name, category, confidence, price_hint, source: 'mobilenet' };
}

/** Classify image using Gemini Vision (requires API key) */
async function recognizeWithGemini(base64: string): Promise<RecognitionResult> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          { text: `Identify the product in this image. Return ONLY a JSON object with: name (specific product name), category (one of: Grocery, Pharmacy, Clothing, Accessories, Electronics, Other), price_hint (rough Indian retail price as string, e.g. "₹40-60/kg"), confidence ("high","medium","low"). JSON:` },
        ],
      }],
    }),
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid Gemini response');

  const parsed = JSON.parse(match[0]);
  return { ...parsed, source: 'gemini' };
}

/**
 * Main entry: tries Gemini first (if key available), falls back to MobileNet.
 * @param file - The File object from an <input type="file">
 * @param onProgress - Optional progress callback ('loading_model' | 'classifying')
 */
export async function recognizeProductImage(
  file: File,
  onProgress?: (status: string) => void
): Promise<RecognitionResult> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // If Gemini key is available, use it
  if (geminiKey) {
    onProgress?.('Analyzing with Gemini AI…');
    const base64 = await fileToBase64(file);
    return await recognizeWithGemini(base64);
  }

  // Otherwise, use in-browser MobileNet
  onProgress?.('Loading AI model… (first time only, ~16MB)');
  const img = await fileToImageElement(file);
  onProgress?.('Classifying image…');
  return await recognizeWithMobileNet(img);
}

// ── Helpers ──────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data:...;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
