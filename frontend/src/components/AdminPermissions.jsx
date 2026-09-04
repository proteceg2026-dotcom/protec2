import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Key, Edit, Trash2, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPermissions() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'sales',
    max_discount_percent: 10,
    can_approve: false,
    can_upload_price: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'sales',
      max_discount_percent: 10,
      can_approve: false,
      can_upload_price: false
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingId(u.id);
    setFormData({
      username: u.username,
      password: '', // blank unless changing
      name: u.name,
      role: u.role,
      max_discount_percent: u.max_discount_percent,
      can_approve: u.can_approve === 1,
      can_upload_price: u.can_upload_price === 1
    });
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingId) {
        res = await api.updateUser(editingId, formData);
      } else {
        res = await api.createUser(formData);
      }
      if (res.success) {
        setModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف هذا الموظف من النظام؟')) return;
    try {
      const res = await api.deleteUser(id);
      if (res.success) fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#fbbf24' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>لوحة تحكم مدير النظام وصلاحيات الموظفين</h3>
            <p style={{ fontSize: '0.85rem' }}>تحديد حدود الخصم المسموحة للموظفين، والأدوار الوظيفية، والاعتمادات</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <UserPlus size={18} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل المستخدمين...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <th style={{ padding: '12px' }}>اسم الموظف</th>
                  <th style={{ padding: '12px' }}>اسم المستخدم</th>
                  <th style={{ padding: '12px' }}>الدور الوظيفي</th>
                  <th style={{ padding: '12px' }}>حد الخصم المسموح %</th>
                  <th style={{ padding: '12px' }}>صلاحية الاعتماد</th>
                  <th style={{ padding: '12px' }}>صلاحية رفع الأسعار</th>
                  <th style={{ padding: '12px', width: '90px' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>{u.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.username}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-lead">
                        {u.role === 'admin' ? 'مدير النظام' : (u.role === 'manager' ? 'مدير مبيعات' : 'مندوب مبيعات')}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#60a5fa' }}>
                      {u.max_discount_percent}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.can_approve ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#64748b" />}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.can_upload_price ? <CheckCircle2 size={18} color="#34d399" /> : <XCircle size={18} color="#64748b" />}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleOpenEditModal(u)} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>
                          <Edit size={16} />
                        </button>
                        {u.id !== currentUser.id && (
                          <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ marginBottom: '16px' }}>{editingId ? 'تعديل صلاحيات وتفاصيل الموظف' : 'إضافة موظف جديد'}</h3>
            <form onSubmit={handleSaveUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">الاسم الكامل للموظف</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="input-label">اسم المستخدم (للتسجيل)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingId}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">كلمة السر {editingId ? '(اتركها فارغة بدون تغيير)' : ''}</label>
                  <input
                    type="password"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingId}
                  />
                </div>
                <div>
                  <label className="input-label">الدور الوظيفي</label>
                  <select
                    className="input-field"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="sales">مندوب مبيعات</option>
                    <option value="manager">مدير مبيعات</option>
                    <option value="admin">مدير النظام (Admin)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">الحد الأقصى للخصم المباشر المسموح به (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={formData.max_discount_percent}
                  onChange={(e) => setFormData({ ...formData, max_discount_percent: e.target.value })}
                  required
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  * إذا أدخل الموظف خصماً أعلى من هذه النسبة، سيتحول عرض السعر إلى طلب بانتظار موافقة المدير.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.can_approve}
                    onChange={(e) => setFormData({ ...formData, can_approve: e.target.checked })}
                  />
                  <span>صلاحية اعتماد عروض الأسعار فوريًا (Approve Quotations)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.can_upload_price}
                    onChange={(e) => setFormData({ ...formData, can_upload_price: e.target.checked })}
                  />
                  <span>صلاحية رفع وتحديث قوائم الأسعار (Excel / PDF)</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الصلاحيات</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
