import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, stores, products } from '../lib/api';
import { ArrowLeft, ArrowRight, Check, MapPin, Loader2, Trash2 } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import './VendorSetupPage.css';

const UNITS = ['piece', 'kg', 'g', 'L', 'mL', 'dozen', 'pack'];
type ProductLine = { name: string; price: string; unit: string };
type Step = 'auth' | 'details' | 'location' | 'products';

const STEPS: Step[] = ['auth', 'details', 'location', 'products'];
const STEP_LABELS = ['Account', 'Store Info', 'Location', 'Products'];

export default function VendorSetupPage() {
  const [step, setStep] = useState<Step>(auth.isLoggedIn() ? 'details' : 'auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auth step
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('testpassword123');

  // Store details
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [upiId, setUpiId] = useState('');

  // Location
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [locationText, setLocationText] = useState('');
  const [gettingLoc, setGettingLoc] = useState(false);

  // Products
  const [productLines, setProductLines] = useState<ProductLine[]>([{ name: '', price: '', unit: 'piece' }]);
  const [done, setDone] = useState(false);
  const [storeId, setStoreId] = useState('');

  const stepIdx = STEPS.indexOf(step);

  const handleAuthNext = async () => {
    if (!phone.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      // Try register first (idempotent — if already exists, it auto-logs in)
      await auth.register(phone, password);
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Account creation failed');
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
    setError('');
    try {
      // Create store via API
      const store = await stores.create({
        name: storeName.trim(),
        category,
        phone: phone.trim(),
        location_text: locationText.trim() || undefined,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        upi_id: upiId.trim() || undefined,
      });

      setStoreId(store.id);

      // Add initial products
      const validProducts = productLines.filter((p) => p.name.trim());
      if (validProducts.length > 0) {
        await products.add(
          store.id,
          validProducts.map((p) => ({
            name: p.name.trim(),
            price: parseFloat(p.price) || 0,
            unit: p.unit,
            is_in_stock: true,
          }))
        );
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Error creating store. Make sure backend is running.');
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

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 14
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step: Account */}
        {step === 'auth' && (
          <div className="fade-up">
            <h2 className="setup-title">Create your vendor account</h2>
            <p className="setup-sub">Enter a phone number and password — no email needed!</p>
            <div className="phone-input-wrap">
              <span className="phone-prefix">+91</span>
              <input
                className="input-field phone-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => { setError(''); setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); }}
                maxLength={10}
                type="tel"
              />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Set a password"
                value={password}
                onChange={(e) => { setError(''); setPassword(e.target.value); }}
              />
            </div>
            <button
              className="btn btn-primary btn-lg setup-next-btn"
              onClick={handleAuthNext}
              disabled={phone.length < 10 || !password || loading}
            >
              {loading ? 'Creating account…' : <>Create Account & Continue <ArrowRight size={18} /></>}
            </button>
            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#6b7280' }}>
              Already registered?{' '}
              <button
                style={{ background: 'none', border: 'none', color: '#0F6E56', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => navigate('/vendor-login')}
              >
                Sign in instead
              </button>
            </p>
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
              <label className="form-label">UPI ID for Payments (Optional)</label>
              <input
                className="input-field"
                placeholder="e.g. yourname@ybl"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
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
            <p className="setup-sub">Add a few key products. You can add more from the dashboard later.</p>
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
