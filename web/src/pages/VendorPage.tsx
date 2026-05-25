import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, stores as storesApi, products as productsApi } from '../lib/api';
import { parseProductText, lookupBarcode, hasGeminiKey } from '../lib/ai';
import { recognizeProductImage, preloadImageModel } from '../lib/imageRecognition';
import { useSpeech } from '../hooks/useSpeech';
import BarcodeScanner from '../components/BarcodeScanner';
import BillGenerator from '../components/BillGenerator';
import {
  Store, LogOut, Plus, ToggleLeft, ToggleRight,
  TrendingUp, Phone, Eye, ArrowRight, Package, Pencil, Check, X,
  Mic, MicOff, Camera, Scan, Receipt, Loader2, AlertCircle, Settings
} from 'lucide-react';
import './VendorPage.css';

const UNITS = ['piece', 'kg', 'g', 'L', 'mL', 'dozen', 'pack'];

export default function VendorPage() {
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add product form
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addUnit, setAddUnit] = useState('piece');
  const [addingProduct, setAddingProduct] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Inline price editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editUnitValue, setEditUnitValue] = useState('piece');
  const [savingPrice, setSavingPrice] = useState(false);
  const priceInputRef = useRef<HTMLInputElement>(null);

  // AI modals
  const [showBarcode, setShowBarcode] = useState(false);
  const [showBill, setShowBill] = useState(false);

  // Image recognition
  const imageInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // Voice: add product via speech
  const { status: voiceStatus, error: voiceError, start: startVoice, stop: stopVoice } = useSpeech(
    async (transcript) => {
      setAiStatus(`Heard: "${transcript}"`);
      setAiProcessing(true);
      try {
        if (hasGeminiKey()) {
          const parsed = await parseProductText(transcript);
          setAddName(parsed.name);
          setAddPrice(parsed.price > 0 ? String(parsed.price) : '');
          setAddUnit(parsed.unit || 'piece');
          setAiStatus(`Parsed: ${parsed.name}${parsed.price > 0 ? ` @ ₹${parsed.price}` : ''}`);
        } else {
          // Fallback: simple regex parse without Gemini
          setAddName(transcript);
          const priceMatch = transcript.match(/(\d+(\.\d+)?)\s*(rs|rupees?|₹)?/i);
          if (priceMatch) setAddPrice(priceMatch[1]);
          setAiStatus(`Set name from voice (add Gemini key for smart parsing)`);
        }
        setShowAddForm(true);
      } catch (e) {
        setAiStatus('Could not parse. Please fill form manually.');
      }
      setAiProcessing(false);
    }
  );

  useEffect(() => {
    fetchVendorData();
    preloadImageModel();
  }, []);

  const fetchVendorData = async () => {
    setLoading(true);
    setFetchError('');

    if (!auth.isLoggedIn()) {
      navigate('/vendor-login', { replace: true });
      return;
    }

    try {
      const storeData = await storesApi.myStore();
      if (!storeData) {
        navigate('/vendor-setup', { replace: true });
        return;
      }
      setStore(storeData);
      setProducts(storeData.products || []);
      setSettingsForm({
        name: storeData.name || '',
        category: storeData.category || '',
        phone: storeData.phone || '',
        location_text: storeData.location_text || '',
        upi_id: storeData.upi_id || ''
      });
      
      // Fetch real stats
      try {
        const storeStats = await storesApi.stats(storeData.id);
        setStats(storeStats);
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    } catch (err: any) {
      if (err.message?.includes('Not authenticated') || err.message?.includes('401')) {
        auth.logout();
        navigate('/vendor-login', { replace: true });
        return;
      }
      setFetchError(`Failed to load store: ${err.message}`);
    }

    setLoading(false);
  };

  const toggleStock = async (product: any) => {
    const newStatus = !product.is_in_stock;
    setProducts(products.map((p) => p.id === product.id ? { ...p, is_in_stock: newStatus } : p));
    try {
      await productsApi.update(product.id, { is_in_stock: newStatus });
    } catch (err) {
      // Revert on failure
      setProducts(products.map((p) => p.id === product.id ? { ...p, is_in_stock: product.is_in_stock } : p));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !store) return;
    setAddingProduct(true);

    try {
      const [newProduct] = await productsApi.add(store.id, [{
        name: addName.trim(),
        price: parseFloat(addPrice) || 0,
        unit: addUnit,
        is_in_stock: true,
      }]);
      setProducts((prev) => [newProduct, ...prev]);
      setAddName(''); setAddPrice(''); setAddUnit('piece');
      setShowAddForm(false); setAiStatus('');
    } catch (err: any) {
      setAiStatus(`❌ Save failed: ${err.message}`);
    }

    setAddingProduct(false);
  };

  const startEditPrice = (product: any) => {
    setEditingPriceId(product.id);
    setEditPriceValue(product.price > 0 ? String(product.price) : '');
    setEditUnitValue(product.unit || 'piece');
    setTimeout(() => priceInputRef.current?.focus(), 50);
  };
  const savePrice = async (productId: string) => {
    setSavingPrice(true);
    const newPrice = parseFloat(editPriceValue) || 0;
    setProducts(products.map((p) => p.id === productId ? { ...p, price: newPrice, unit: editUnitValue } : p));
    try {
      await productsApi.update(productId, { price: newPrice, unit: editUnitValue });
    } catch (err) {
      console.error('Price update failed:', err);
    }
    setEditingPriceId(null); setSavingPrice(false);
  };
  const cancelEdit = () => setEditingPriceId(null);

  // Barcode scan result → Open Food Facts lookup
  const handleBarcode = async (code: string) => {
    setShowBarcode(false);
    setAiStatus(`Barcode: ${code} — looking up…`);
    setAiProcessing(true);
    const result = await lookupBarcode(code);
    if (result) {
      setAddName(result.brand ? `${result.name} (${result.brand})` : result.name);
      setAiStatus(`Found: ${result.name}`);
    } else {
      setAddName(code);
      setAiStatus(`Product not found in database. Barcode: ${code}`);
    }
    setShowAddForm(true);
    setAiProcessing(false);
  };

  // Image → AI recognition (MobileNet in-browser OR Gemini if key set)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiProcessing(true);
    setAiStatus('Starting image recognition…');
    setShowAddForm(false);

    try {
      const result = await recognizeProductImage(file, (progress) => {
        setAiStatus(progress);
      });

      setAddName(result.name);
      const statusParts = [
        `✅ Identified: ${result.name}`,
        result.category !== 'Other' ? `(${result.category})` : '',
        result.confidence ? `· ${result.confidence} confidence` : '',
        result.price_hint ? `· Est. ${result.price_hint}` : '',
        result.source === 'mobilenet' ? '· Powered by MobileNet AI' : '· Powered by Gemini',
      ].filter(Boolean).join(' ');
      setAiStatus(statusParts);
      setShowAddForm(true);
    } catch (err: any) {
      setAiStatus(`❌ Recognition failed: ${err.message}`);
    }

    setAiProcessing(false);
    e.target.value = '';
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/vendor-login');
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setFetchError('');
    try {
      const updatedStore = await storesApi.update(store.id, settingsForm);
      setStore(updatedStore);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setFetchError(e.message || 'Failed to update settings');
    }
    setSavingSettings(false);
  };

  if (loading) return <div className="vendor-loading"><div className="spinner" /></div>;

  // These cases are handled by redirects in fetchVendorData,
  // but show a fallback spinner while navigation happens
  if (!store) return <div className="vendor-loading"><div className="spinner" /></div>;

  const inStock = products.filter((p) => p.is_in_stock).length;
  const isListening = voiceStatus === 'listening';

  return (
    <div className="vendor-root">
      {/* Barcode scanner modal */}
      {showBarcode && <BarcodeScanner onDetected={handleBarcode} onClose={() => setShowBarcode(false)} />}

      {/* Bill generator modal */}
      {showBill && <BillGenerator store={store} products={products} onClose={() => setShowBill(false)} />}

      {/* Hidden image input */}
      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {/* Sidebar */}
      <aside className="vendor-sidebar">
        <div className="vendor-brand">
          <span>🛍️</span>
          <div>
            <div className="vendor-brand-title">Local Store</div>
            <div className="vendor-brand-sub">Vendor Portal</div>
          </div>
        </div>
        <nav className="vendor-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Store size={18} /> Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /> Settings
          </div>
        </nav>
        <div className="vendor-sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Logout</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 12px' }} onClick={() => navigate('/')}>← Buyer View</button>
        </div>
      </aside>

      {/* Main */}
      <main className="vendor-main">
        {activeTab === 'dashboard' ? (
          <>
            {/* Header */}
        <div className="vendor-header">
          <div>
            <div className="vendor-header-label">Manage Store</div>
            <h1 className="vendor-header-title">{store.name}</h1>
          </div>
          <div className="store-meta">
            {store.category && <span className="badge badge-blue">{store.category}</span>}
            {store.phone && <span className="store-phone"><Phone size={13} /> {store.phone}</span>}
            <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowBill(true)}>
              <Receipt size={15} /> Generate Bill
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#E1F5EE' }}><Package size={20} color="#0F6E56" /></div>
            <div>
              <div className="stat-number">{stats?.total_products || products.length || 0}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EEF2FF' }}><TrendingUp size={20} color="#4338CA" /></div>
            <div>
              <div className="stat-number">₹{stats?.avg_price ? Number(stats.avg_price).toFixed(0) : 0}</div>
              <div className="stat-label">Avg Item Price</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FFF8EB' }}><Check size={20} color="#8A5703" /></div>
            <div>
              <div className="stat-number">{stats?.in_stock || inStock}/{stats?.total_products || products.length}</div>
              <div className="stat-label">Items in stock</div>
            </div>
          </div>
        </div>

        {/* Promo */}
        <div className="promo-card">
          <div className="promo-icon"><TrendingUp size={24} /></div>
          <div className="promo-text">
            <div className="promo-title">📣 Boost your store visibility</div>
            <div className="promo-sub">Appear at the top of local searches and reach more customers.</div>
          </div>
          <button className="btn promo-btn">Upgrade now →</button>
        </div>

        {/* Fetch error banner */}
        {fetchError && (
          <div className="fetch-error-banner fade-up">
            <div className="fetch-error-icon">⚠️</div>
            <div className="fetch-error-body">
              <div className="fetch-error-title">Could not load products</div>
              <div className="fetch-error-msg">{fetchError}</div>
              <div className="fetch-error-hint">
                <strong>Tip:</strong> Make sure the FastAPI backend is running at <code>http://localhost:8000</code> and your JWT token is valid.
              </div>
            </div>
            <button className="btn btn-primary" style={{ fontSize: 13, flexShrink: 0 }} onClick={fetchVendorData}>
              ↺ Retry
            </button>
          </div>
        )}

        {/* AI Status banner */}
        {(aiStatus || aiProcessing) && (
          <div className="ai-status-banner fade-up">
            {aiProcessing ? <Loader2 size={16} className="spin-icon" /> : <AlertCircle size={16} />}
            <span>{aiStatus || 'Processing…'}</span>
            <button onClick={() => setAiStatus('')}><X size={14} /></button>
          </div>
        )}

        {/* Products */}
        <div className="products-section-v">
          <div className="products-header-v">
            <h2>My Products</h2>
            {/* AI input methods */}
            <div className="ai-toolbar">
              <button
                className={`ai-btn ${isListening ? 'ai-btn-active' : ''}`}
                onClick={isListening ? stopVoice : startVoice}
                title="Voice add product"
                disabled={aiProcessing}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? 'Listening…' : 'Voice'}
              </button>
              <button
                className="ai-btn"
                onClick={() => imageInputRef.current?.click()}
                title="Add product from photo"
                disabled={aiProcessing}
              >
                <Camera size={16} /> Photo
              </button>
              <button
                className="ai-btn"
                onClick={() => setShowBarcode(true)}
                title="Scan barcode"
                disabled={aiProcessing}
              >
                <Scan size={16} /> Barcode
              </button>
              <button
                className="btn btn-primary ai-add-btn"
                onClick={() => { setShowAddForm(!showAddForm); setAiStatus(''); }}
              >
                <Plus size={15} /> Manual
              </button>
            </div>
          </div>

          {voiceError && <div className="ai-error-msg">{voiceError}</div>}

          {/* Add form */}
          {showAddForm && (
            <form className="add-product-form fade-up" onSubmit={handleAddProduct}>
              <input
                className="input-field"
                placeholder="Product name *"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
                autoFocus
              />
              <div className="price-unit-row">
                <div className="price-input-wrap">
                  <span className="currency-prefix">₹</span>
                  <input
                    className="input-field price-input-inner"
                    placeholder="Price"
                    type="number" min="0" step="0.01"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                  />
                </div>
                <select className="input-field unit-select" value={addUnit} onChange={(e) => setAddUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={addingProduct} style={{ flex: 1 }}>
                  {addingProduct ? 'Adding…' : 'Add Product'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowAddForm(false); setAiStatus(''); }}>Cancel</button>
              </div>
            </form>
          )}

          {products.length === 0 ? (
            <div className="empty-state"><Package size={36} /><p>No products yet. Use Voice, Photo, or Barcode to add!</p></div>
          ) : (
            <div className="vendor-products-list">
              {products.map((product) => (
                <div key={product.id} className="vendor-product-row">
                  <div className="vendor-product-info">
                    <div className="vendor-product-name">{product.name}</div>
                    {editingPriceId === product.id ? (
                      <div className="inline-price-editor fade-up">
                        <span className="currency-prefix-sm">₹</span>
                        <input
                          ref={priceInputRef}
                          className="inline-price-input"
                          type="number" min="0" step="0.01" placeholder="0.00"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') savePrice(product.id); if (e.key === 'Escape') cancelEdit(); }}
                        />
                        <select className="inline-unit-select" value={editUnitValue} onChange={(e) => setEditUnitValue(e.target.value)}>
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button className="inline-action save" onClick={() => savePrice(product.id)} disabled={savingPrice} title="Save"><Check size={14} /></button>
                        <button className="inline-action cancel" onClick={cancelEdit} title="Cancel"><X size={14} /></button>
                      </div>
                    ) : (
                      <button className="price-display-btn" onClick={() => startEditPrice(product)} title="Click to edit price">
                        {product.price > 0 ? (
                          <><span className="vendor-product-price">₹{product.price}</span>{product.unit && <span className="vendor-product-unit">/ {product.unit}</span>}</>
                        ) : (
                          <span className="set-price-hint">Set price…</span>
                        )}
                        <Pencil size={12} className="price-edit-icon" />
                      </button>
                    )}
                  </div>
                  <button
                    className={`toggle-btn ${product.is_in_stock ? 'in-stock' : 'out-stock'}`}
                    onClick={() => toggleStock(product)}
                  >
                    {product.is_in_stock ? <><ToggleRight size={20} /> In stock</> : <><ToggleLeft size={20} /> Out of stock</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        ) : (
          <div className="settings-panel fade-up">
            <div className="vendor-header" style={{ marginBottom: 24 }}>
              <div>
                <div className="vendor-header-label">Store Preferences</div>
                <h1 className="vendor-header-title">Settings</h1>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input
                  className="input-field"
                  value={settingsForm.name}
                  onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="input-field"
                  value={settingsForm.category}
                  onChange={e => setSettingsForm({ ...settingsForm, category: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="input-field"
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Area</label>
                <input
                  className="input-field"
                  value={settingsForm.location_text}
                  onChange={e => setSettingsForm({ ...settingsForm, location_text: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPI ID for Payments</label>
                <input
                  className="input-field"
                  value={settingsForm.upi_id}
                  placeholder="e.g. sharma@ybl"
                  onChange={e => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                />
                <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>This is used to generate QR codes on bills.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 16 }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                >
                  {savingSettings ? <Loader2 size={16} className="spin-icon" /> : <Check size={16} />}
                  {savingSettings ? ' Saving...' : ' Save Settings'}
                </button>
                {saveSuccess && (
                  <span style={{ color: '#059669', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={16} /> Saved successfully
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
