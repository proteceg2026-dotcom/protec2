import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, Building, FileText, Search, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function CRMManager() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Customer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers(search);
      if (res.success) setCustomers(res.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      tax_id: '',
      status: 'active',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      company: c.company || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      tax_id: c.tax_id || '',
      status: c.status || 'active',
      notes: c.notes || ''
    });
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingId) {
        res = await api.updateCustomer(editingId, formData);
      } else {
        res = await api.createCustomer(formData);
      }
      if (res.success) {
        setModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا العميل من سجل الـ CRM؟')) return;
    try {
      const res = await api.deleteCustomer(id);
      if (res.success) fetchCustomers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#818cf8' }}>
            <Users size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>نظام إدارة العملاء (Integrated CRM System)</h3>
            <p style={{ fontSize: '0.85rem' }}>إدارة سجل الشركات والعملاء، ومتابعة عروض الأسعار والصفقات</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search & Customer Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العميل أو الشركة أو الهاتف..."
              style={{ paddingRight: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            عدد العملاء المسجلين: <strong>{customers.length}</strong>
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري تحميل العملاء...</div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
            <p>لا يوجد عملاء مسجلين حالياً. اضغط إضافة عميل جديد لإنشاء سجل.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {customers.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>{c.name}</h4>
                      {c.company && (
                        <p style={{ fontSize: '0.85rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Building size={14} />
                          <span>{c.company}</span>
                        </p>
                      )}
                    </div>
                    <span className="badge badge-approved">{c.status}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                    {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> <span>{c.phone}</span></div>}
                    {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> <span>{c.email}</span></div>}
                  </div>

                  {c.notes && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                      {c.notes}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <button onClick={() => handleOpenEditModal(c)} className="btn btn-secondary btn-sm">
                    <Edit size={14} />
                    <span>تعديل</span>
                  </button>
                  <button onClick={() => handleDeleteCustomer(c.id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '16px' }}>{editingId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
            <form onSubmit={handleSaveCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">اسم العميل</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">اسم الشركة / المؤسسة</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">رقم الهاتف</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="input-label">ملاحظات العميل</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
