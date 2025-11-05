import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StoreDetailPage from './pages/StoreDetailPage';
import VendorPage from './pages/VendorPage';
import VendorLoginPage from './pages/VendorLoginPage';
import VendorSetupPage from './pages/VendorSetupPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/store/:id" element={<StoreDetailPage />} />
        <Route path="/vendor" element={<VendorPage />} />
        <Route path="/vendor-login" element={<VendorLoginPage />} />
        <Route path="/vendor-setup" element={<VendorSetupPage />} />
      </Routes>
    </BrowserRouter>
  );
}
