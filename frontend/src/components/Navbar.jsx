import React, { useState } from 'react';
import { 
  Bot, 
  FileText, 
  ListOrdered, 
  Tag, 
  Users, 
  ShieldCheck, 
  Server, 
  LogOut, 
  Menu, 
  X, 
  UserCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getServerUrl } from '../services/api';

export default function Navbar({ activeTab, setActiveTab, onOpenServerModal, onOpenLoginModal }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const serverUrl = getServerUrl();

  const navItems = [
    { id: 'ai', label: 'المساعد الذكي', icon: Bot },
    { id: 'builder', label: 'إنشاء عرض سعر', icon: FileText },
    { id: 'quotes', label: 'عروض الأسعار', icon: ListOrdered },
    { id: 'pricelist', label: 'لستة الأسعار', icon: Tag },
    { id: 'crm', label: 'إدارة العملاء CRM', icon: Users },
  ];

  if (user && (user.role === 'admin' || user.role === 'manager')) {
    navItems.push({ id: 'admin', label: 'الصلاحيات والنظام', icon: ShieldCheck });
  }

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 16px 16px', position: 'sticky', top: 0, zIndex: 50, marginBottom: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
          }}>
            <Bot color="#fff" size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ProTec Sales Assistant
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>مساعد المبيعات الذكي والـ CRM</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '6px' }} className="desktop-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))' : 'transparent',
                  color: isActive ? '#60a5fa' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Server status pill */}
          <button
            onClick={onOpenServerModal}
            className="btn btn-secondary btn-sm"
            title="تغيير وإعدادات السيرفر"
            style={{ borderRadius: '20px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <Server size={14} color="#10b981" />
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {serverUrl.replace('http://', '').replace('https://', '')}
            </span>
          </button>

          {/* User Profile / Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }} className="user-info-text">
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', color: '#60a5fa' }}>
                  {user.role === 'admin' ? 'مدير النظام' : (user.role === 'manager' ? 'مدير مبيعات' : `خصم مسموح: ${user.max_discount_percent}%`)}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn btn-danger btn-sm"
                title="تسجيل الخروج"
                style={{ padding: '7px' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenLoginModal} className="btn btn-primary btn-sm">
              <UserCircle size={16} />
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ padding: '16px 20px', borderTop: 'var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: isActive ? '#60a5fa' : 'var(--text-muted)',
                  textAlign: 'right'
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
