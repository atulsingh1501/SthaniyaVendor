import { useState } from 'react';
import { X, Printer, MessageCircle, Plus, Minus, Receipt } from 'lucide-react';
import './BillGenerator.css';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  is_in_stock: boolean;
}

interface BillItem { product: Product; qty: number; }

interface Props {
  store: any;
  products: Product[];
  onClose: () => void;
}

export default function BillGenerator({ store, products, onClose }: Props) {
  const [items, setItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [step, setStep] = useState<'build' | 'preview'>('build');

  const stockedProducts = products.filter((p) => p.is_in_stock && p.price > 0);

  const getQty = (id: string) => items.find((i) => i.product.id === id)?.qty || 0;

  const updateQty = (product: Product, delta: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (!existing) {
        if (delta > 0) return [...prev, { product, qty: 1 }];
        return prev;
      }
      const newQty = existing.qty + delta;
      if (newQty <= 0) return prev.filter((i) => i.product.id !== product.id);
      return prev.map((i) => i.product.id === product.id ? { ...i, qty: newQty } : i);
    });
  };

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const billDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const buildBillHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill — ${store.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; color: #111; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0F6E56; padding-bottom: 12px; }
    .store-name { font-size: 22px; font-weight: 800; color: #0F6E56; }
    .store-info { font-size: 12px; color: #666; margin-top: 4px; }
    .bill-meta { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 700; color: #555; border-bottom: 1px solid #ddd; }
    td { padding: 10px; font-size: 13px; border-bottom: 1px solid #eee; }
    td:last-child, th:last-child { text-align: right; }
    .total-row td { font-size: 15px; font-weight: 800; border-top: 2px solid #0F6E56; color: #0F6E56; border-bottom: none; padding-top: 12px; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">🛍️ ${store.name}</div>
    <div class="store-info">${store.category || ''} ${store.location_text ? '· ' + store.location_text : ''}</div>
    ${store.phone ? `<div class="store-info">📞 ${store.phone}</div>` : ''}
  </div>
  <div class="bill-meta">
    <span>${customerName ? `Customer: ${customerName}` : ''}</span>
    <span>Date: ${billDate}</span>
  </div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${items.map((i) => `
        <tr>
          <td>${i.product.name}</td>
          <td>${i.qty} ${i.product.unit}</td>
          <td>₹${i.product.price}</td>
          <td>₹${(i.product.price * i.qty).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>₹${total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">Thank you for shopping locally! 🙏</div>
</body>
</html>`;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildBillHTML());
    win.document.close();
    win.print();
  };

  const handleWhatsApp = () => {
    const lines = items.map((i) => `• ${i.product.name} x${i.qty} = ₹${(i.product.price * i.qty).toFixed(2)}`);
    const msg = `*Bill from ${store.name}*\n${billDate}\n\n${lines.join('\n')}\n\n*Total: ₹${total.toFixed(2)}*\n\nThank you! 🙏`;
    const phone = customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone ? '91' + phone : ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bill-overlay">
      <div className="bill-modal">
        <div className="bill-top">
          <div className="bill-title"><Receipt size={18} /> Generate Bill</div>
          <button className="scanner-close" onClick={onClose}><X size={18} /></button>
        </div>

        {step === 'build' ? (
          <div className="bill-body">
            <div className="bill-customer">
              <input className="input-field" placeholder="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input className="input-field" placeholder="Customer phone (for WhatsApp)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0,10))} />
            </div>

            <div className="bill-products-label">Select Products & Quantities</div>
            {stockedProducts.length === 0 ? (
              <p className="bill-empty">No products with prices set. Add prices first.</p>
            ) : (
              <div className="bill-product-list">
                {stockedProducts.map((p) => {
                  const qty = getQty(p.id);
                  return (
                    <div key={p.id} className={`bill-product-row ${qty > 0 ? 'selected' : ''}`}>
                      <div className="bill-product-info">
                        <div className="bill-product-name">{p.name}</div>
                        <div className="bill-product-price">₹{p.price} / {p.unit}</div>
                      </div>
                      <div className="bill-qty-control">
                        <button className="qty-btn" onClick={() => updateQty(p, -1)} disabled={qty === 0}><Minus size={14} /></button>
                        <span className="qty-value">{qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(p, 1)}><Plus size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="bill-summary">
                <span>{items.length} item(s) · <strong>Total: ₹{total.toFixed(2)}</strong></span>
                <button className="btn btn-primary" onClick={() => setStep('preview')}>Preview Bill →</button>
              </div>
            )}
          </div>
        ) : (
          <div className="bill-body">
            <div className="bill-preview">
              <div className="preview-header">
                <div className="preview-store">{store.name}</div>
                <div className="preview-date">{billDate}</div>
              </div>
              {customerName && <div className="preview-customer">Customer: {customerName}</div>}
              <table className="preview-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.product.id}>
                      <td>{i.product.name}</td>
                      <td>{i.qty} {i.product.unit}</td>
                      <td>₹{(i.product.price * i.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="preview-total-row">
                    <td colSpan={2}>Total</td>
                    <td>₹{total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="bill-actions-row">
              <button className="btn btn-ghost" onClick={() => setStep('build')}>← Edit</button>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Print</button>
              <button className="btn whatsapp-btn" onClick={handleWhatsApp}><MessageCircle size={16} /> WhatsApp</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
