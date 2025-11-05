import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, Check, MapPin, Loader2, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import './VendorSetupPage.css';

const UNITS = ['piece', 'kg', 'g', 'L', 'mL', 'dozen', 'pack'];
type ProductLine = { name: string; price: string; unit: string };

type Step = 'phone' | 'details' | 'location' | 'products';

const STEPS: Step[] = ['phone', 'details', 'location', 'products'];
const STEP_LABELS = ['Phone', 'Store Info', 'Location', 'Products'];

export default function VendorSetupPage() {
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step data
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locationText, setLocationText] = useState('');
  const [gettingLoc, setGettingLoc] = useState(false);
  const [productLines, setProductLines] = useState<ProductLine[]>([{ name: '', price: '', unit: 'piece' }]);
  const [done, setDone] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  const handlePhoneNext = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    try {
      const fakeEmail = `${phone.trim()}@teststore.com`;
      let { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail, password: 'testpassword123',
      });
      if (error?.message?.includes('Invalid login credentials')) {
        const { data: sd, error: se } = await supabase.auth.signUp({
          email: fakeEmail, password: 'testpassword123',
        });
        if (se) throw se;
        if (!sd?.session) {
          alert("Please disable 'Confirm email' in Supabase Dashboard → Authentication → Providers → Email, then try again.");
          setLoading(false); return;
        }
      } else if (error) throw error;
      setStep('details');
    } catch (e: any) {
      alert(e.message || 'Error during login');
    }
    setLoading(false);
  };

  const handleDetailsNext = () => {
    if (!storeName.trim() || !category) return;
    setStep('location');
  };

  const getLocation = () => {
    setGettingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGettingLoc(false);
      },
      () => { alert('Could not get location. Enter manually.'); setGettingLoc(false); }
    );
  };

  const handleLocationNext = () => {
    if (!lat || !lng) return;
    setStep('products');
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const vendorId = auth.user?.id;
      if (!vendorId) throw new Error('Not authenticated');

      // Create store
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .insert({
          vendor_id: vendorId,
          name: storeName.trim(),
          category,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          location_text: locationText.trim() || undefined,
          phone: phone.trim(),
          rating: 4.5,
        })
        .select()
        .single();
      if (storeErr) throw storeErr;

      // Add products — try with price/unit, fall back if columns missing
      const validProducts = productLines.filter((p) => p.name.trim());
      if (validProducts.length > 0) {
        const { error: prodErr } = await supabase.from('products').insert(
          validProducts.map((p) => ({
            store_id: storeData.id,
            name: p.name.trim(),
            price: parseFloat(p.price) || 0,
            unit: p.unit,
            is_in_stock: true,
          }))
        );
        // If columns don't exist (400), retry with minimal fields
        if (prodErr && (prodErr.code === '42703' || prodErr.message?.includes('column'))) {
          await supabase.from('products').insert(
            validProducts.map((p) => ({
              store_id: storeData.id,
              name: p.name.trim(),
              is_in_stock: true,
            }))
          );
        }
      }
      setDone(true);
    } catch (e: any) {
      alert(e.message || 'Error creating store');
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="setup-root">
        <div className="setup-card success-card">
          <div className="success-icon"><Check size={40} color="#fff" /></div>
          <h2>Store Created! 🎉</h2>
          <p>Your store is live on the map. Customers nearby can now discover you.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/vendor')}>
            Go to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-root">
      <div className="setup-card">
        {/* Back button */}
        <button className="setup-back" onClick={() => stepIdx > 0 ? setStep(STEPS[stepIdx - 1]) : navigate('/')}>
          <ArrowLeft size={16} />
        </button>

        {/* Progress */}
        <div className="setup-progress">
          {STEPS.map((s, i) => (
            <div key={s} className="progress-step-wrap">
              <div className={`progress-dot ${i <= stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}>
                {i < stepIdx ? <Check size={12} color="#fff" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`progress-line ${i < stepIdx ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>
        <div className="setup-step-label">{STEP_LABELS[stepIdx]}</div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <div className="fade-up">
            <h2 className="setup-title">Enter your phone number</h2>
            <p className="setup-sub">We'll use this to identify your vendor account.</p>
            <div className="phone-input-wrap">
              <span className="phone-prefix">+91</span>
              <input
                className="input-field phone-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                type="tel"
              />
            </div>
            <button
              className="btn btn-primary btn-lg setup-next-btn"
              onClick={handlePhoneNext}
              disabled={phone.length < 10 || loading}
            >
              {loading ? 'Verifying…' : <>Verify & Continue <ArrowRight size={18} /></>}
            </button>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="fade-up">
            <h2 className="setup-title">Store Details</h2>
            <p className="setup-sub">Tell customers about your store.</p>
            <div className="form-group">
              <label className="form-label">Store Name</label>
              <input
                className="input-field"
                placeholder="e.g. Sharma Grocery"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="cats-grid" style={{ marginTop: 8 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`chip ${category === cat.name ? 'active' : ''}`}
                    style={category === cat.name ? { background: cat.color } : {}}
                    onClick={() => setCategory(cat.name)}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg setup-next-btn"
              onClick={handleDetailsNext}
              disabled={!storeName.trim() || !category}
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Location */}
        {step === 'location' && (
          <div className="fade-up">
            <h2 className="setup-title">Store Location</h2>
            <p className="setup-sub">Help customers find you on the map.</p>
            <button
              className="btn btn-outline btn-lg get-loc-btn"
              onClick={getLocation}
              disabled={gettingLoc}
            >
              {gettingLoc ? <><Loader2 size={18} className="spin-icon" /> Getting location…</> : <><MapPin size={18} /> Use My Current Location</>}
            </button>
            <div className="or-divider">or enter manually</div>
            <div className="coords-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="input-field" placeholder="22.3072" value={lat} onChange={(e) => setLat(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="input-field" placeholder="73.1812" value={lng} onChange={(e) => setLng(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Area / Locality (optional)</label>
              <input className="input-field" placeholder="e.g. Alkapuri, Vadodara" value={locationText} onChange={(e) => setLocationText(e.target.value)} />
            </div>
            <button
              className="btn btn-primary btn-lg setup-next-btn"
              onClick={handleLocationNext}
              disabled={!lat || !lng}
            >
              Next <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Products */}
        {step === 'products' && (
          <div className="fade-up">
            <h2 className="setup-title">Add Your Products</h2>
            <p className="setup-sub">Add a few key products to attract buyers. You can add more later.</p>
            <div className="products-inputs">
              {productLines.map((p, i) => (
                <div key={i} className="setup-product-row">
                  <input
                    className="input-field setup-product-name"
                    placeholder={`Product ${i + 1} name`}
                    value={p.name}
                    onChange={(e) => {
                      const updated = [...productLines];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setProductLines(updated);
                    }}
                  />
                  <div className="setup-price-wrap">
                    <span className="setup-rupee">₹</span>
                    <input
                      className="input-field setup-price-input"
                      placeholder="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.price}
                      onChange={(e) => {
                        const updated = [...productLines];
                        updated[i] = { ...updated[i], price: e.target.value };
                        setProductLines(updated);
                      }}
                    />
                  </div>
                  <select
                    className="input-field setup-unit-select"
                    value={p.unit}
                    onChange={(e) => {
                      const updated = [...productLines];
                      updated[i] = { ...updated[i], unit: e.target.value };
                      setProductLines(updated);
                    }}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {productLines.length > 1 && (
                    <button
                      type="button"
                      className="setup-remove-btn"
                      onClick={() => setProductLines(productLines.filter((_, j) => j !== i))}
                      title="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
              {productLines.length < 10 && (
                <button
                  className="btn btn-ghost add-product-line-btn"
                  onClick={() => setProductLines([...productLines, { name: '', price: '', unit: 'piece' }])}
                >
                  + Add another product
                </button>
              )}
            </div>
            <button
              className="btn btn-primary btn-lg setup-next-btn"
              onClick={handleFinish}
              disabled={loading}
            >
              {loading ? 'Creating store…' : <>Finish & Go Live 🚀</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
