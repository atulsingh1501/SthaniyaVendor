import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/api';
import { Phone, ArrowRight, Store, Loader2, ShieldCheck } from 'lucide-react';
import './VendorLoginPage.css';

export default function VendorLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('testpassword123');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await auth.login(phone, password);
      } else {
        await auth.register(phone, password);
      }
      navigate('/vendor');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-root">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <span className="login-brand-icon">🛍️</span>
            <div>
              <div className="login-brand-name">SthaniyaVendor</div>
              <div className="login-brand-tag">Vendor Portal</div>
            </div>
          </div>

          <h1 className="login-headline">
            Manage your store,<br />
            <span className="login-headline-accent">grow your business.</span>
          </h1>
          <p className="login-subline">
            Add products, toggle stock, generate bills, and get discovered by local buyers — all in one place.
          </p>

          <div className="login-features">
            {[
              { icon: '🎙️', text: 'Add products by voice' },
              { icon: '📷', text: 'AI image recognition' },
              { icon: '📸', text: 'Barcode scanner' },
              { icon: '🧾', text: 'Instant bill generation' },
            ].map((f) => (
              <div key={f.text} className="login-feature-chip">
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon">
              <Store size={24} color="#0F6E56" />
            </div>
            <h2 className="login-card-title">
              {mode === 'login' ? 'Vendor Login' : 'Create Account'}
            </h2>
            <p className="login-card-sub">
              {mode === 'login'
                ? 'Enter your phone and password to continue'
                : 'Register your vendor account to get started'}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field-label">Phone Number</div>
            <div className="login-phone-wrap">
              <div className="login-phone-prefix">
                <Phone size={15} />
                <span>+91</span>
              </div>
              <input
                className="login-phone-input"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => {
                  setError('');
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                }}
                maxLength={10}
                autoFocus
              />
            </div>

            <div className="login-field-label" style={{ marginTop: 12 }}>Password</div>
            <input
              className="login-phone-input"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none' }}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => { setError(''); setPassword(e.target.value); }}
            />

            {error && (
              <div className="login-error fade-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={phone.length < 10 || !password || loading}
            >
              {loading ? (
                <><Loader2 size={18} className="spin-icon" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Register'} <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>{mode === 'login' ? 'New vendor?' : 'Already registered?'}</span>
          </div>

          <button
            className="register-btn"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create a new account →' : '← Back to Login'}
          </button>

          <div className="login-secure-note">
            <ShieldCheck size={13} />
            Secured with JWT · Powered by FastAPI + PostgreSQL
          </div>

          <button
            className="login-back-link"
            onClick={() => navigate('/')}
          >
            ← Back to buyer map
          </button>
        </div>
      </div>
    </div>
  );
}
