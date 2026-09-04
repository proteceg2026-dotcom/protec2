import React, { useState, useEffect } from 'react';
import { Tag, Upload, Plus, Trash2, Search, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PriceListManager() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

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
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts(search);
      if (res.success) setProducts(res.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
        fetchProducts();
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
      category: 'عام',
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
        fetchProducts();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا المنتج من قائمة الأسعار؟')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
            <Tag size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>لستة الأسعار والمنتجات (Price List Catalog)</h3>
            <p style={{ fontSize: '0.85rem' }}>إدارة وتحديث قوائم الأسعار برفع ملفات Excel / PDF أو الإضافة اليدوية</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
          <Upload size={18} />
          <span>رفع لستة أسعار جديدة (Excel / CSV / PDF)</span>
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
            <span>{uploading ? 'جاري الاستيراد والمعالجة...' : 'استيراد لستة الأسعار'}</span>
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

      {/* Product Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالكود أو الاسم..."
              style={{ paddingRight: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            إجمالي المنتجات: <strong>{products.length}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل المنتجات...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <th style={{ padding: '12px' }}>الكود (SKU)</th>
                  <th style={{ padding: '12px' }}>اسم المنتج</th>
                  <th style={{ padding: '12px' }}>القسم</th>
                  <th style={{ padding: '12px' }}>سعر الوحدة</th>
                  <th style={{ padding: '12px' }}>المخزون</th>
                  <th style={{ padding: '12px', width: '90px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#60a5fa' }}>{p.code}</td>
                    <td style={{ padding: '12px' }}>
                      <strong>{p.name}</strong>
                      {p.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.description}</p>}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.category}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <label className="input-label">القسم / التصنيف</label>
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
