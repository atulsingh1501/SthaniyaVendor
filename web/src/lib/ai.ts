// Gemini API service for NLP + Vision
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/** Parse a natural-language product description into structured data */
export async function parseProductText(text: string): Promise<{ name: string; price: number; unit: string }> {
  const prompt = `Extract product details from this vendor's speech/text. Return ONLY a JSON object with keys: name (string), price (number, 0 if not mentioned), unit (one of: piece, kg, g, L, mL, dozen, pack).
Text: "${text}"
JSON:`;
  const raw = await callGemini(prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { name: text, price: 0, unit: 'piece' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { name: text, price: 0, unit: 'piece' };
  }
}

/** Identify a product from an image */
export async function identifyProductImage(base64: string): Promise<{ name: string; category: string; price_hint: string }> {
  const prompt = `Look at this product image. Return ONLY a JSON object with: name (product name, be specific), category (one of: Grocery, Pharmacy, Clothing, Accessories, Electronics, Other), price_hint (rough Indian retail price as string, e.g. "₹40-60").
JSON:`;
  const raw = await callGemini(prompt, base64);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return { name: 'Unknown Product', category: 'Other', price_hint: '' };
  try {
    return JSON.parse(match[0]);
  } catch {
    return { name: 'Unknown Product', category: 'Other', price_hint: '' };
  }
}

/** Lookup barcode via Open Food Facts */
export async function lookupBarcode(barcode: string): Promise<{ name: string; brand?: string } | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const json = await res.json();
    if (json.status === 1 && json.product?.product_name) {
      return {
        name: json.product.product_name,
        brand: json.product.brands,
      };
    }
  } catch {}
  return null;
}

export const hasGeminiKey = () => !!GEMINI_KEY;
