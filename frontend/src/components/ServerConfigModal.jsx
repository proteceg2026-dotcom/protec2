import React, { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { getServerUrl, setServerUrl, api } from '../services/api';

export default function ServerConfigModal({ isOpen, onClose }) {
  const [url, setUrlInput] = useState(getServerUrl());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', text: '' }

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await api.ping(url);
      if (res.success) {
        setStatus({ type: 'success', text: `تم الاتصال بالسيرفر بنجاح! (${res.message})` });
      } else {
        setStatus({ type: 'error', text: 'السيرفر استجاب ولكن هناك تنبيه.' });
      }
    } catch (err) {
      setStatus({ type: 'error', text: `فشل الاتصال: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const saved = setServerUrl(url);
    setUrlInput(saved);
    setStatus({ type: 'success', text: 'تم حفظ عنوان السيرفر بنجاح!' });
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <Server size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>إعدادات اتصال السيرفر</h3>
              <p style={{ fontSize: '0.85rem' }}>قم بإدخال عنوان سيرفر الشركة (IP / Domain)</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="input-label">رابط خادم البيانات (Server API Endpoint)</label>
          <input
            type="text"
            className="input-field"
            value={url}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="مثال: http://192.168.1.100:5000 أو https://api.mycompany.com"
            dir="ltr"
            style={{ fontWeight: '600' }}
          />
          <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-dim)' }}>
            * يتيح هذا الخيار تشغيل التطبيق على الموبايل والكمبيوتر والاتصال بأي سيرفر محلي أو سحابي.
          </p>
        </div>

        {status && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: status.type === 'success' ? '#34d399' : '#f87171',
            border: status.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{status.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={testing}
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
            {testing ? 'جاري الفحص...' : 'فحص الاتصال'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
