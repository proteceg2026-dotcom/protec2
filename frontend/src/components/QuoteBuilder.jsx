import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Users, 
  Calculator,
  Building
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function QuoteBuilder({ prefilledDraft, onQuoteCreated }) {
  const { user } = useAuth();
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [cartItems, setCartItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Load Customers & Products
  useEffect(() => {
    loadData();
  }, []);

  // Handle Prefilled draft from AI Assistant
  useEffect(() => {
    if (prefilledDraft && prefilledDraft.product) {
      const p = prefilledDraft.product;
      setCartItems([{
        id: p.id,
        code: p.code,
        name: p.name,
        unit_price: p.unit_price,
        quantity: prefilledDraft.quantity || 1
      }]);
      if (prefilledDraft.discount_percent) {
        setDiscountPercent(prefilledDraft.discount_percent);
      }
    }
  }, [prefilledDraft]);

  const loadData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.getCustomers(),
        api.getProducts()
      ]);
      if (cRes.success) setCustomers(cRes.customers);
      if (pRes.success) setProducts(pRes.products);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    if (id) {
      const found = customers.find(c => String(c.id) === String(id));
      if (found) setCustomerName(found.name + (found.company ? ` (${found.company})` : ''));
    }
  };

  const handleAddProductToCart = (prod) => {
    const existingIdx = cartItems.findIndex(item => item.code === prod.code);
    if (existingIdx > -1) {
      const updated = [...cartItems];
      updated[existingIdx].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems(prev => [
        ...prev,
        {
          id: prod.id,
          code: prod.code,
          name: prod.name,
          unit_price: prod.unit_price,
          quantity: 1
        }
      ]);
    }
  };

  const handleQuantityChange = (index, delta) => {
    const updated = [...cartItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setCartItems(updated);
  };

  const handleUnitPriceChange = (index, newPrice) => {
    const updated = [...cartItems];
    updated[index].unit_price = parseFloat(newPrice) || 0;
    setCartItems(updated);
  };

  const removeItem = (index) => {
    const updated = [...cartItems];
    updated.splice(index, 1);
    setCartItems(updated);
  };

  // Subtotals & Discounts
  const totalBeforeDiscount = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = (totalBeforeDiscount * (parseFloat(discountPercent) || 0)) / 100;
  const finalAmount = totalBeforeDiscount - discountAmount;

  // Permission Check
  const maxAllowed = user ? (user.max_discount_percent || 10) : 10;
  const isOverDiscountLimit = (parseFloat(discountPercent) || 0) > maxAllowed && (!user || (!user.can_approve && user.role === 'sales'));

  // Save Quotation in DB
  const handleSaveQuote = async () => {
    if (cartItems.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل بعرض السعر');
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const payload = {
        customer_id: selectedCustomerId || null,
        customer_name: customerName || 'عميل نقدي',
        items: cartItems,
        discount_percent: parseFloat(discountPercent) || 0,
        notes
      };

      const res = await api.createQuote(payload);
      if (res.success) {
        setStatusMsg({
          type: res.status === 'submitted' ? 'warning' : 'success',
          text: res.message,
          quoteNumber: res.quote_number
        });

        // Trigger export PDF
        generatePDF(res.quote_number);

        if (onQuoteCreated) onQuoteCreated();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Export PDF Generator
  const generatePDF = (qNum) => {
    const quoteNumber = qNum || `Q-${Date.now().toString().slice(-6)}`;
    const doc = new jsPDF();

    // Company Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ProTec Smart Systems & Solutions', 14, 22);

    doc.setFontSize(10);
    doc.text('QUOTATION / OFFER DE PRIX / ARABIC SALES OFFER', 14, 30);

    doc.setFontSize(14);
    doc.text(`QUOTATION #: ${quoteNumber}`, 140, 22);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 140, 30);

    // Customer & Details section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Customer Name: ${customerName || 'Cash Client'}`, 14, 52);
    doc.text(`Sales Rep: ${user ? user.name : 'ProTec Representative'}`, 14, 60);

    // Table of Items
    const tableData = cartItems.map((item, idx) => [
      idx + 1,
      item.code,
      item.name,
      item.quantity,
      `${item.unit_price.toLocaleString()} EGP`,
      `${(item.unit_price * item.quantity).toLocaleString()} EGP`
    ]);

    doc.autoTable({
      startY: 68,
      head: [['#', 'SKU / Code', 'Product Name', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals Box
    doc.setFillColor(241, 245, 249);
    doc.rect(120, finalY, 76, 35, 'F');
    doc.setFontSize(10);
    doc.text(`Subtotal: ${totalBeforeDiscount.toLocaleString()} EGP`, 125, finalY + 10);
    doc.text(`Discount (${discountPercent}%): -${discountAmount.toLocaleString()} EGP`, 125, finalY + 18);
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`NET TOTAL: ${finalAmount.toLocaleString()} EGP`, 125, finalY + 28);

    // Terms
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Notes & Terms:', 14, finalY + 10);
    doc.text(notes || 'Validity: 15 Days from quote date. Taxes extra if applicable.', 14, finalY + 18);

    // Save
    doc.save(`Quotation_${quoteNumber}.pdf`);
  };

  const filteredProducts = products.filter(p => 
    p.code.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Title & User Permission bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
            <FileText size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>منشئ عروض الأسعار (Smart Quotation Engine)</h3>
            <p style={{ fontSize: '0.85rem' }}>اختر العميل والمنتجات، وطبق الخصومات حسب صلاحياتك</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span>حدك المسموح للخصم: </span>
            <strong style={{ color: '#60a5fa' }}>{user ? `${user.max_discount_percent}%` : '10%'}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Left Column: Customer & Product Selector */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
            <Users size={18} />
            <span>بيانات العميل واختيار المنتجات</span>
          </h4>

          {/* Customer Dropdown / Name */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">اختر عميل مسجل (نظام CRM)</label>
            <select
              className="input-field"
              value={selectedCustomerId}
              onChange={handleSelectCustomer}
              style={{ marginBottom: '8px' }}
            >
              <option value="">-- عميل نقدي / إدخال يدوي --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''} - {c.phone}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="input-field"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="أو اكتب اسم العميل يدويًا..."
            />
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '16px 0' }} />

          {/* Product Search Catalog */}
          <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
            <Search size={16} />
            <span>بحث السريع بالكود (SKU) أو اسم المنتج</span>
          </h4>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              className="input-field"
              value={searchProductQuery}
              onChange={(e) => setSearchProductQuery(e.target.value)}
              placeholder="ادخل كود المنتج مثل PRD-101 أو الكلمة..."
            />
          </div>

          {/* Product Cards List */}
          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProducts.map(p => (
              <div
                key={p.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 'bold' }}>
                      {p.code}
                    </span>
                    <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    السعر: <strong style={{ color: '#34d399' }}>{p.unit_price.toLocaleString()} {p.currency}</strong> | المخزون: {p.stock_quantity}
                  </p>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddProductToCart(p)}
                >
                  <Plus size={16} />
                  <span>إضافة</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quote Table & Calculations */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            <Calculator size={18} />
            <span>جدول عروض الأسعار والحساب التلقائي</span>
          </h4>

          {/* Cart Table */}
          <div style={{ flex: 1, overflowX: 'auto', marginBottom: '16px' }}>
            {cartItems.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <FileText size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p>لم يتم إضافة منتجات بعرض السعر بعد. ابحث عن منتج وأضفه من القائمة.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <th style={{ padding: '8px' }}>الكود</th>
                    <th style={{ padding: '8px' }}>المنتج</th>
                    <th style={{ padding: '8px', width: '90px' }}>الكمية</th>
                    <th style={{ padding: '8px', width: '110px' }}>السعر</th>
                    <th style={{ padding: '8px' }}>الإجمالي</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px', fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold' }}>{item.code}</td>
                      <td style={{ padding: '8px' }}>{item.name}</td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => handleQuantityChange(idx, -1)} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(idx, 1)} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                          style={{ width: '80px', padding: '4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#34d399' }}>
                        {(item.unit_price * item.quantity).toLocaleString()} EGP
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Discount & Totals Section */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>الإجمالي قبل الخصم:</span>
              <strong>{totalBeforeDiscount.toLocaleString()} EGP</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>نسبة الخصم المطبقة %:</span>
              <input
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                style={{ width: '100px', textAlign: 'center', padding: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>قيمة الخصم:</span>
              <span style={{ color: '#f87171' }}>-{discountAmount.toLocaleString()} EGP</span>
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
              <strong style={{ color: '#fff' }}>صافي عرض السعر النهائي:</strong>
              <strong style={{ color: '#34d399', fontSize: '1.2rem' }}>{finalAmount.toLocaleString()} EGP</strong>
            </div>
          </div>

          {/* Over Discount Warning Banner */}
          {isOverDiscountLimit && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={20} flexShrink={0} />
              <span>
                تنبيه: الخصم المدخل (<strong>{discountPercent}%</strong>) يتجاوز حد الخصم المباشر المسموح لك به (<strong>{maxAllowed}%</strong>).
                عند حفظ هذا العرض سيتم تحويله تلقائيًا إلى <strong>"بانتظار موافقة المدير"</strong>.
              </span>
            </div>
          )}

          {statusMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.88rem',
              background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: statusMsg.type === 'error' ? '#f87171' : '#34d399',
              border: statusMsg.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveQuote}
              disabled={loading || cartItems.length === 0}
              style={{ flex: 1 }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'جاري الحفظ...' : (isOverDiscountLimit ? 'رفع طلب الاعتماد للمدير' : 'اعتماد وعمل عرض السعر')}</span>
            </button>

            <button
              className="btn btn-accent"
              onClick={() => generatePDF()}
              disabled={cartItems.length === 0}
            >
              <Download size={18} />
              <span>تصدير PDF</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
