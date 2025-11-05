import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Star, Phone, Navigation, MessageCircle, Search, X, Bell, Package } from 'lucide-react';
import './StoreDetailPage.css';

export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    const { data } = await supabase
      .from('stores')
      .select('*, products(*)')
      .eq('id', id)
      .single();
    setStore(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="detail-loading">
        <p style={{ color: 'var(--text-dim)', marginBottom: 16 }}>Store not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          ← Back to Map
        </button>
      </div>
    );
  }

  const filtered = (store.products || []).filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const inStock = filtered.filter((p: any) => p.is_in_stock);
  const outOfStock = filtered.filter((p: any) => !p.is_in_stock);

  return (
    <div className="detail-root">
      {/* Header */}
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-search-wrap">
          <Search size={15} className="detail-search-icon" />
          <input
            className="detail-search"
            placeholder={`Search in ${store.name}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="detail-body">
        {/* Store info card */}
        <div className="store-info-card card">
          <div className="info-top">
            <div>
              <h1 className="detail-store-name">{store.name}</h1>
              <p className="detail-store-sub">
                {store.category || 'General Store'}
                {store.location_text && <> · {store.location_text}</>}
                <span className="open-badge">Open now</span>
              </p>
            </div>
            {store.rating && (
              <div className="badge badge-yellow" style={{ flexShrink: 0 }}>
                <Star size={13} fill="#FFB800" color="#FFB800" />
                {store.rating}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="detail-actions">
            <a href={`tel:${store.phone || '+919876543210'}`} className="action-tile">
              <div className="action-icon" style={{ background: '#E1F5EE' }}>
                <Phone size={20} color="#0F6E56" />
              </div>
              <span>Call</span>
            </a>
            <a
              href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="action-tile"
            >
              <div className="action-icon" style={{ background: '#EEEDFE' }}>
                <Navigation size={20} color="#3C3489" />
              </div>
              <span>Directions</span>
            </a>
            <a
              href={`https://wa.me/${store.phone || '919876543210'}?text=Hi, do you have...`}
              target="_blank"
              rel="noreferrer"
              className="action-tile"
            >
              <div className="action-icon" style={{ background: '#E8F5E9' }}>
                <MessageCircle size={20} color="#388E3C" />
              </div>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Products */}
        <div className="products-section">
          <div className="products-header">
            <h2>All Items</h2>
            <span className="store-count">{filtered.length} items</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Package size={36} />
              <p>No items found</p>
            </div>
          ) : (
            <>
              {inStock.length > 0 && (
                <div className="product-group">
                  {inStock.map((p: any, i: number) => (
                    <div key={p.id} className={`product-row ${i < inStock.length - 1 ? 'border-b' : ''}`}>
                      <div className="product-info">
                        <div className="product-name">{p.name}</div>
                        {p.category && <div className="product-cat">{p.category}</div>}
                      </div>
                      <div className="product-price">
                        {typeof p.price === 'number' ? `₹${p.price.toFixed(2)}` : p.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {outOfStock.length > 0 && (
                <>
                  <div className="oos-divider">Out of Stock</div>
                  <div className="product-group oos-group">
                    {outOfStock.map((p: any) => (
                      <div key={p.id} className="product-row">
                        <div className="product-info">
                          <div className="product-name" style={{ opacity: 0.5 }}>{p.name}</div>
                          {p.category && <div className="product-cat">{p.category}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span className="badge badge-red">Out of stock</span>
                          <button
                            className="notify-btn"
                            onClick={() => alert(`Stock alert set for ${p.name}!`)}
                          >
                            <Bell size={12} /> Notify Me
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
