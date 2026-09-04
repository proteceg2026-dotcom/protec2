import React, { useState, useEffect } from 'react';
import { Tag, Upload, Plus, Trash2, Search, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Edit, Download, Percent, Shield } from 'lucide-react';
import { api, getServerUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PriceListManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState([]);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Active Tab: 'products' | 'discounts'
  const [activeSubTab, setActiveSubTab] = useState('products');

  // New Discount Rule Form
  const [ruleFormData, setRuleFormData] = useState({
    target: '',
    min_quantity: 1,
    discount_percent: 10,
    terms: ''
  });

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'عام',
    unit_price: '',
    min_price: '',
    stock_quantity: 10,
    currency: 'EGP'
  });

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.getProducts(search),
        api.getDiscountRules()
      ]);
      if (pRes.success) {
        setProducts(pRes.products);
        setSelectedIds([]);
      }
      if (rRes.success) {
        setDiscountRules(rRes.rules);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`${getServerUrl()}/api/products/download-template`, '_blank');
  };

  const handleAddDiscountRule = async (e) => {
    e.preventDefault();
    if (!ruleFormData.target || !ruleFormData.discount_percent) return;
    try {
      const res = await api.createDiscountRule(ruleFormData);
      if (res.success) {
        setRuleFormData({ target: '', min_quantity: 1, discount_percent: 10, terms: '' });
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDiscountRule = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف شرط الخصم هذا؟')) return;
    try {
      const res = await api.deleteDiscountRule(id);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`هل أنت تأكد من حذف ${selectedIds.length} منتج محدد من قائمة الأسعار؟`)) return;

    try {
      const res = await api.bulkDeleteProducts(selectedIds, false);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearAllCatalog = async () => {
    if (!window.confirm('⚠️ تحذير: هل أنت تأكد من مسح جميع المنتجات الموجودة في لستة الأسعار بالكامل؟')) return;

    try {
      const res = await api.bulkDeleteProducts([], true);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const res = await api.uploadPriceList(selectedFile);
      if (res.success) {
        setUploadStatus({ type: 'success', text: res.message });
        setSelectedFile(null);
        fetchData();
      }
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      category: 'المولدات',
      unit_price: '',
      min_price: '',
      stock_quantity: 10,
      currency: 'EGP'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingId(p.id);
    setFormData({
      code: p.code,
      name: p.name,
      description: p.description || '',
      category: p.category || 'عام',
      unit_price: p.unit_price,
      min_price: p.min_price || '',
      stock_quantity: p.stock_quantity,
      currency: p.currency || 'EGP'
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingId) {
        res = await api.updateProduct(editingId, formData);
      } else {
        res = await api.createProduct(formData);
      }
      if (res.success) {
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا المنتج من قائمة الأسعار؟')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
            <Tag size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>لستة الأسعار والخصومات والعائلات (Price & Discount Catalog)</h3>
            <p style={{ fontSize: '0.85rem' }}>إدارة وتحديث قوائم الأسعار وشروط خصومات العائلات عبر ملف Excel القياسي أو يدويًا</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
            <Download size={18} />
            <span>تحميل نموذج الإكسيل القياسي 📥</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Switcher */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          className={`btn ${activeSubTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('products')}
        >
          <Tag size={16} />
          <span>جدول الأسعار والمنتجات ({products.length})</span>
        </button>

        <button
          className={`btn ${activeSubTab === 'discounts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('discounts')}
        >
          <Percent size={16} />
          <span>شروط وخصومات العائلات ({discountRules.length})</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
          <Upload size={18} />
          <span>رفع ملف لستة الأسعار والخصومات القياسي (Excel / CSV / PDF)</span>
        </h4>

        <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv, .pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="input-field"
              style={{ padding: '8px' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={!selectedFile || uploading}
          >
            <FileSpreadsheet size={18} />
            <span>{uploading ? 'جاري الاستيراد والمعالجة...' : 'استيراد الأسعار والخصومات'}</span>
          </button>
        </form>

        {uploadStatus && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: uploadStatus.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {uploadStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{uploadStatus.text}</span>
          </div>
        )}
      </div>

      {/* TAB 1: PRODUCTS CATALOG TABLE */}
      {activeSubTab === 'products' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <input
                type="text"
                className="input-field"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالكود أو الاسم أو العائلة..."
                style={{ paddingRight: '36px' }}
              />
              <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                إجمالي المنتجات: <strong>{products.length}</strong>
              </span>

              {products.length > 0 && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleClearAllCatalog}
                  title="مسح جميع المنتجات في الكتالوج بالكامل"
                >
                  <Trash2 size={15} />
                  <span>مسح القائمة بالكامل</span>
                </button>
              )}
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.2s ease'
            }}>
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>
                تم تحديد ({selectedIds.length}) منتج من لستة الأسعار
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteSelected}>
                  <Trash2 size={16} />
                  <span>حذف المنتجات المحددة ({selectedIds.length})</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds([])}>
                  إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل المنتجات...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <th style={{ padding: '12px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedIds.length === products.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th style={{ padding: '12px' }}>الكود (SKU)</th>
                    <th style={{ padding: '12px' }}>اسم المنتج</th>
                    <th style={{ padding: '12px' }}>العائلة / القسم</th>
                    <th style={{ padding: '12px' }}>سعر الوحدة</th>
                    <th style={{ padding: '12px' }}>المخزون</th>
                    <th style={{ padding: '12px', width: '90px' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#60a5fa' }}>{p.code}</td>
                        <td style={{ padding: '12px' }}>
                          <strong>{p.name}</strong>
                          {p.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.description}</p>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                            {p.category || 'عام'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#34d399' }}>
                          {p.unit_price.toLocaleString()} {p.currency || 'EGP'}
                        </td>
                        <td style={{ padding: '12px' }}>{p.stock_quantity} قطعة</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenEditModal(p)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DISCOUNT POLICY & FAMILY RULES */}
      {activeSubTab === 'discounts' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent size={18} />
            <span>إضافة شرط خصم جديد للعائلة أو المنتج</span>
          </h4>

          {/* Add Rule Form */}
          <form onSubmit={handleAddDiscountRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
            <div>
              <label className="input-label">اسم العائلة أو كود المنتج</label>
              <input
                type="text"
                className="input-field"
                value={ruleFormData.target}
                onChange={(e) => setRuleFormData({ ...ruleFormData, target: e.target.value })}
                placeholder="مثال: المولدات أو PRD-101"
                required
              />
            </div>
            <div>
              <label className="input-label">الحد الأدنى للكمية</label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={ruleFormData.min_quantity}
                onChange={(e) => setRuleFormData({ ...ruleFormData, min_quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">نسبة الخصم التلقائية %</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={ruleFormData.discount_percent}
                onChange={(e) => setRuleFormData({ ...ruleFormData, discount_percent: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">شروط وملاحظات الخصم</label>
              <input
                type="text"
                className="input-field"
                value={ruleFormData.terms}
                onChange={(e) => setRuleFormData({ ...ruleFormData, terms: e.target.value })}
                placeholder="مثال: خصم عائلة التوريدات"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} />
                <span>إضافة الشرط</span>
              </button>
            </div>
          </form>

          {/* Discount Rules Table */}
          <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', color: '#fff' }}>قواعد وخصومات العائلات المسجلة حالياً:</h4>
          {discountRules.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: '20px', textAlign: 'center' }}>لا توجد شروط خصومات مسجلة بعد. ارفع ملف الإكسيل القياسي أو أضف شرط خصم يدويًا.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <th style={{ padding: '10px' }}>العائلة / الهدف</th>
                  <th style={{ padding: '10px' }}>الحد الأدنى للكمية</th>
                  <th style={{ padding: '10px' }}>نسبة الخصم %</th>
                  <th style={{ padding: '10px' }}>الشروط والملاحظات</th>
                  <th style={{ padding: '10px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {discountRules.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#818cf8' }}>{r.target}</td>
                    <td style={{ padding: '10px' }}>{r.min_quantity} قطعة فأكثر</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#34d399' }}>{r.discount_percent}%</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{r.terms || '-'}</td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => handleDeleteDiscountRule(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '16px' }}>{editingId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>
            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">كود المنتج (SKU)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">اسم المنتج</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">سعر البيع (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">المخزون الحالي</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">العائلة / القسم</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
