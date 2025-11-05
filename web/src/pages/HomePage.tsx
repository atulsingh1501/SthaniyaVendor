import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CATEGORIES, getCategoryDetails, DEFAULT_LAT, DEFAULT_LNG } from '../lib/constants';
import { useSpeech } from '../hooks/useSpeech';
import { Search, Navigation, Phone, Store, Star, X, MapPin, Mic, MicOff } from 'lucide-react';
import './HomePage.css';

// Fix default marker icons for Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCategoryIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color};border:2.5px solid #fff;
      border-radius:50%;width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.25);
      cursor:pointer;transition:transform 0.15s;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.2 });
  }, [position, map]);
  return null;
}

export default function HomePage() {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Voice search
  const { status: voiceStatus, start: startVoice, stop: stopVoice } = useSpeech(
    (transcript) => setSearchQuery(transcript)
  );
  const isListening = voiceStatus === 'listening';

  useEffect(() => {
    fetchStores();
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  const fetchStores = async () => {
    const { data } = await supabase.from('stores').select('*, products(count)');
    setStores(data || []);
    setLoading(false);
  };

  const filtered = stores.filter((s) => {
    const matchCat = !selectedCategory || s.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && s.latitude != null && s.longitude != null;
  });

  return (
    <div className="home-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-icon">🛍️</span>
            <div>
              <h1 className="brand-title">Local Store</h1>
              <p className="brand-sub">Hyperlocal Discovery</p>
            </div>
          </div>
          <button className="btn btn-primary vendor-btn" onClick={() => navigate('/vendor-login')}>
            <Store size={15} /> Vendor Portal
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search stores, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
          ) : (
            <button
              className={`voice-search-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopVoice : startVoice}
              title={isListening ? 'Stop listening' : 'Search by voice'}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="cats-label">Categories</div>
        <div className="cats-grid">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                className={`chip ${active ? 'active' : ''}`}
                style={active ? { background: cat.color } : {}}
                onClick={() => setSelectedCategory(active ? null : cat.name)}
              >
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>

        {/* Store list */}
        <div className="stores-label">
          <span>Nearby Stores</span>
          <span className="store-count">{filtered.length}</span>
        </div>
        <div className="store-list">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <MapPin size={32} />
              <p>No stores found</p>
            </div>
          ) : (
            filtered.map((store) => {
              const { icon, color } = getCategoryDetails(store.category);
              const isSelected = selectedStore?.id === store.id;
              return (
                <div
                  key={store.id}
                  className={`store-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedStore(store);
                    setFlyTo([store.latitude, store.longitude]);
                  }}
                >
                  <div className="store-item-icon" style={{ background: color + '22', color }}>
                    {icon}
                  </div>
                  <div className="store-item-info">
                    <div className="store-item-name">{store.name}</div>
                    <div className="store-item-cat">{store.category || 'General Store'}</div>
                  </div>
                  {store.rating && (
                    <div className="store-item-rating">
                      <Star size={12} fill="#FFB800" color="#FFB800" />
                      {store.rating}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Map area */}
      <main className="map-area">
        <MapContainer
          center={[DEFAULT_LAT, DEFAULT_LNG]}
          zoom={13}
          className="map"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyToUser position={flyTo} />

          {filtered.map((store) => {
            const { icon, color } = getCategoryDetails(store.category);
            return (
              <Marker
                key={store.id}
                position={[store.latitude, store.longitude]}
                icon={createCategoryIcon(color, icon)}
                eventHandlers={{ click: () => setSelectedStore(store) }}
              />
            );
          })}

          {userPos && (
            <Marker
              position={userPos}
              icon={L.divIcon({
                className: '',
                html: `<div style="
                  width:16px;height:16px;background:#2196F3;
                  border:3px solid #fff;border-radius:50%;
                  box-shadow:0 0 0 4px rgba(33,150,243,0.25);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          )}
        </MapContainer>

        {/* My Location FAB */}
        <button
          className="fab-location"
          onClick={() => userPos && setFlyTo([...userPos])}
          title="Go to my location"
        >
          <Navigation size={20} color="#0F6E56" />
        </button>

        {/* Store popup card */}
        {selectedStore && (
          <div className="store-popup fade-up">
            <button className="popup-close" onClick={() => setSelectedStore(null)}>
              <X size={18} />
            </button>
            <div className="popup-header">
              <div>
                <h2 className="popup-name">{selectedStore.name}</h2>
                <p className="popup-cat">{selectedStore.category || 'General Store'}</p>
              </div>
              {selectedStore.rating && (
                <div className="badge badge-yellow">
                  <Star size={13} fill="#FFB800" color="#FFB800" />
                  {selectedStore.rating}
                </div>
              )}
            </div>
            <div className="popup-actions">
              <a
                href={`tel:${selectedStore.phone || '+919876543210'}`}
                className="btn btn-ghost popup-action-btn"
              >
                <Phone size={16} /> Call
              </a>
              <a
                href={`https://maps.google.com/?q=${selectedStore.latitude},${selectedStore.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost popup-action-btn"
              >
                <Navigation size={16} /> Directions
              </a>
              <button
                className="btn btn-primary popup-action-btn"
                onClick={() => navigate(`/store/${selectedStore.id}`)}
              >
                View Store →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
