import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, ArrowRight, Store, Loader2, ShieldCheck } from 'lucide-react';
import './VendorLoginPage.css';

export default function VendorLoginPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    setError('');

    try {
      const fakeEmail = `${phone.trim()}@teststore.com`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: 'testpassword123',
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('No vendor account found for this number. Please register first.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Account not confirmed. Go to Supabase → Auth → Email → disable "Confirm email".');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Login succeeded — navigate to vendor dashboard.
      // VendorPage will handle: "no store yet → /vendor-setup" and "not logged in → /vendor-login"
      navigate('/vendor');

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
              <div className="login-brand-name">Local Store</div>
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
            <h2 className="login-card-title">Vendor Login</h2>
            <p className="login-card-sub">Enter your registered phone number to continue</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
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

            {error && (
              <div className="login-error fade-up">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={phone.length < 10 || loading}
            >
              {loading ? (
                <><Loader2 size={18} className="spin-icon" /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>New vendor?</span>
          </div>

          <button
            className="register-btn"
            onClick={() => navigate('/vendor-setup')}
          >
            Register your store →
          </button>

          <div className="login-secure-note">
            <ShieldCheck size={13} />
            Secured with Supabase Auth
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
