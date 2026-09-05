import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Upload,
  Plus,
  Trash2,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Edit,
  Download,
  Percent,
  RefreshCw,
  Layers,
  Sparkles,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api, getServerUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PriceListManager() {
  const { user } = useAuth();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'discounts' | 'upload' | 'add'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState([]);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // Add/Edit Product State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'عام',
    unit_price: '',
    min_price: '',
    stock_quantity: 50,
    currency: 'EGP'
  });

  // Discount Rule Form
  const [ruleFormData, setRuleFormData] = useState({
    target: '',
    min_quantity: 1,
    discount_percent: 10,
    terms: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.getProducts(''),
        api.getDiscountRules()
      ]);
      if (pRes.success) {
        setProducts(pRes.products || []);
        setSelectedIds([]);
      }
      if (rRes.success) {
        setDiscountRules(rRes.rules || []);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct categories list
  const categoriesList = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'عام'));
    return Array.from(cats);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p) return false;
      
      // Category Filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);
        const targetText = `${p.code || ''} ${p.name || ''} ${p.category || ''} ${p.description || ''}`.toLowerCase();
        return queryWords.every(w => targetText.includes(w));
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleDownloadTemplate = () => {
    window.open(`${getServerUrl()}/api/products/download-template`, '_blank');
  };

  // Checkbox handlers
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  // Bulk Delete
  const handleBulkDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`⚠️ تأكيد: هل أنت متأكد من حذف (${selectedIds.length}) منتج محدد من قائمة الأسعار؟`)) return;

    try {
      const res = await api.bulkDeleteProducts(selectedIds, false);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  };

  // Clear Entire Catalog
  const handleClearAllCatalog = async () => {
    if (!window.confirm('⚠️ تحذير شديد: هل أنت متأكد من مسح جميع المنتجات الموجودة في لستة الأسعار بالكامل؟')) return;
    if (!window.confirm('🚨 تحذير ثانٍ: سيتم مسح الكتالوج بالكامل. هل تريد المتابعة؟')) return;

    try {
      const res = await api.bulkDeleteProducts([], true);
      if (res.success) {
        fetchData();
      }
    } catch (err) {
      alert('خطأ أثناء مسح الكتالوج: ' + err.message);
    }
  };

  // File Upload
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
        setActiveTab('catalog');
      }
    } catch (err) {
      setUploadStatus({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Save Product (Add / Edit)
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      category: categoriesList[0] || 'عام',
      unit_price: '',
      min_price: '',
      stock_quantity: 50,
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
      stock_quantity: p.stock_quantity || 10,
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
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج من الكتالوج؟')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add Discount Rule
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
    if (!window.confirm('هل أنت متأكد من حذف شرط الخصم؟')) return;
    try {
      const res = await api.deleteDiscountRule(id);
      if (res.success) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Main Banner Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '-40px', top: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))', borderRadius: '16px', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Tag size={30} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                إدارة لستة الأسعار والكتالوج الشامل
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                منظومة الكتالوج الذكية لإدارة الأسعار، شروط خصومات العائلات، والاستيراد التلقائي من ملفات Excel و PDF
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={fetchData} title="تحديث البيانات">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>تحديث</span>
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
              <Download size={16} />
              <span>نموذج الإكسيل القياسي 📥</span>
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={16} />
              <span>إضافة منتج جديد</span>
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '20px' }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackageCheck size={26} style={{ color: '#60a5fa' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>إجمالي المنتجات المسجلة</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#60a5fa' }}>{products.length} منتج</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={26} style={{ color: '#a78bfa' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>الأقسام والعائلات</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#a78bfa' }}>{categoriesList.length} عائلة</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Percent size={26} style={{ color: '#34d399' }} />
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>قواعد الخصم التلقائية</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#34d399' }}>{discountRules.length} شرط خصم</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('catalog'); setCurrentPage(1); }}
        >
          <Tag size={16} />
          <span>📦 جدول المنتجات والأسعار ({filteredProducts.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'discounts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('discounts')}
        >
          <Percent size={16} />
          <span>🏷️ شروط وخصومات العائلات ({discountRules.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} />
          <span>📤 رفع ملف الإكسيل القياسي / PDF</span>
        </button>
      </div>

      {/* TAB 1: CATALOG TABLE & SEARCH */}
      {activeTab === 'catalog' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          
          {/* Search & Category Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Search Box */}
              <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
                <input
                  type="text"
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="ابحث بالكود (SKU)، اسم المنتج، أو العائلة..."
                  style={{ paddingRight: '38px' }}
                />
                <Search size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>

              {/* Bulk Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {selectedIds.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteSelected}>
                    <Trash2 size={15} />
                    <span>حذف المحددة ({selectedIds.length})</span>
                  </button>
                )}

                {products.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleClearAllCatalog} title="مسح الكتالوج بالكامل">
                    <Trash2 size={15} />
                    <span>مسح القائمة بالكامل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Quick Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={14} /> تصفية بالعائلة:
              </span>

              <button
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setSelectedCategory('ALL'); setCurrentPage(1); }}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
              >
                الكل ({products.length})
              </button>

              {categoriesList.map(cat => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Area */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '10px' }} />
              <div>جاري تحميل قائمة الأسعار والمنتجات...</div>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <AlertCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
              <h4 style={{ color: '#fff' }}>لا توجد منتجات تطابق البحث الحقيقي</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>أضف منتج جديد أو قم برفع ملف الإكسيل القياسي لاستيراد الكتالوج فورياً.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                      <th style={{ padding: '12px', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </th>
                      <th style={{ padding: '12px' }}>الكود (SKU)</th>
                      <th style={{ padding: '12px' }}>اسم المنتج / البيان</th>
                      <th style={{ padding: '12px' }}>العائلة / القسم</th>
                      <th style={{ padding: '12px' }}>السعر الأساسي</th>
                      <th style={{ padding: '12px' }}>المخزون المتاح</th>
                      <th style={{ padding: '12px', width: '90px' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map(p => {
                      const isSelected = selectedIds.includes(p.id);
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                            transition: 'background 0.2s'
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
                            <strong style={{ color: '#fff' }}>{p.name}</strong>
                            {p.description && p.description !== p.name && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{p.description}</p>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              {p.category || 'عام'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#34d399', fontSize: '0.95rem' }}>
                            {p.unit_price ? p.unit_price.toLocaleString() : 0} {p.currency || 'EGP'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.stock_quantity || 10} قطعة</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => handleOpenEditModal(p)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }} title="تعديل">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }} title="حذف">
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

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    عرض الصفحة {currentPage} من إجمالي {totalPages} صفحة (إجمالي النتائج: {filteredProducts.length})
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronRight size={16} /> السابق
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      التالي <ChevronLeft size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: DISCOUNT RULES */}
      {activeTab === 'discounts' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent size={20} />
            <span>إضافة شرط خصم تلقائي للعائلة أو المنتج</span>
          </h3>

          <form onSubmit={handleAddDiscountRule} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px', background: 'rgba(0,0,0,0.25)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <label className="input-label">اسم العائلة أو كود المنتج</label>
              <input
                type="text"
                className="input-field"
                value={ruleFormData.target}
                onChange={(e) => setRuleFormData({ ...ruleFormData, target: e.target.value })}
                placeholder="مثال: UPVC أو خرطوم حراري"
                required
              />
            </div>
            <div>
              <label className="input-label">الحد الأدنى للكمية المطلوبة</label>
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
                placeholder="مثال: خصم عائلة التوريدات الحصري"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} />
                <span>إضافة الشرط التلقائي</span>
              </button>
            </div>
          </form>

          <h4 style={{ fontSize: '1rem', marginBottom: '14px', color: '#fff' }}>قواعد وخصومات العائلات المسجلة حالياً:</h4>
          {discountRules.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>لا توجد شروط خصومات مسجلة بعد.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <th style={{ padding: '12px' }}>العائلة / الهدف</th>
                    <th style={{ padding: '12px' }}>الحد الأدنى للكمية</th>
                    <th style={{ padding: '12px' }}>نسبة الخصم %</th>
                    <th style={{ padding: '12px' }}>الشروط والملاحظات</th>
                    <th style={{ padding: '12px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {discountRules.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#818cf8' }}>{r.target}</td>
                      <td style={{ padding: '12px' }}>{r.min_quantity} قطعة فأكثر</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#34d399' }}>{r.discount_percent}%</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.terms || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleDeleteDiscountRule(r.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FILE UPLOAD DROPZONE */}
      {activeTab === 'upload' && (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', width: '70px', height: '70px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <FileSpreadsheet size={36} />
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>رفع وتحديث لستة الأسعار (Excel / CSV / PDF)</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              اختر ملف الإكسيل القياسي أو ملف PDF المحدث وسيقوم النظام باستخراج وتحديث كافة البنود والأسعار تلقائياً.
            </p>

            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="input-field"
                style={{ padding: '12px' }}
              />

              <button
                type="submit"
                className="btn btn-accent"
                disabled={!selectedFile || uploading}
                style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
              >
                <Upload size={20} />
                <span>{uploading ? 'جاري قراءة واستيراد البنود...' : 'استيراد الأسعار والخصومات فورياً'}</span>
              </button>
            </form>

            {uploadStatus && (
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: uploadStatus.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: uploadStatus.type === 'success' ? '#34d399' : '#f87171'
              }}>
                {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{uploadStatus.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <h3 style={{ marginBottom: '16px', color: '#fff' }}>{editingId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للكتالوج'}</h3>
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
                  <label className="input-label">اسم المنتج / البيان</label>
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
                  <label className="input-label">سعر الوحدة الأساسي</label>
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
                  <label className="input-label">المخزون الحالي (قطعة)</label>
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
                <button type="submit" className="btn btn-primary">حفظ المنتج</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
