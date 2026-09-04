import React, { useState, useEffect } from 'react';
import { ListOrdered, Check, X, Download, Filter, FileText, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function QuotesList() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, [filterStatus]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await api.getQuotes(filterStatus);
      if (res.success) {
        setQuotes(res.quotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.updateQuoteStatus(id, status);
      if (res.success) {
        fetchQuotes();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت تأكد من حذف عرض السعر هذا؟')) return;
    try {
      const res = await api.deleteQuote(id);
      if (res.success) fetchQuotes();
    } catch (err) {
      alert(err.message);
    }
  };

  const exportPDF = (q) => {
    const doc = new jsPDF();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ProTec Smart Systems & Solutions', 14, 22);

    doc.setFontSize(10);
    doc.text('OFFICIAL QUOTATION OFFER', 14, 30);

    doc.setFontSize(14);
    doc.text(`QUOTATION #: ${q.quote_number}`, 140, 22);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(q.created_at).toLocaleDateString('en-GB')}`, 140, 30);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Customer Name: ${q.customer_name || 'Cash Client'}`, 14, 52);
    doc.text(`Prepared By: ${q.user_name}`, 14, 60);

    const tableData = (q.items || []).map((item, idx) => [
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
      headStyles: { fillColor: [59, 130, 246], textColor: 255 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFillColor(241, 245, 249);
    doc.rect(120, finalY, 76, 35, 'F');
    doc.setFontSize(10);
    doc.text(`Subtotal: ${q.total_amount.toLocaleString()} EGP`, 125, finalY + 10);
    doc.text(`Discount (${q.discount_percent}%): -${q.discount_amount.toLocaleString()} EGP`, 125, finalY + 18);
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`NET TOTAL: ${q.final_amount.toLocaleString()} EGP`, 125, finalY + 28);

    doc.save(`Quotation_${q.quote_number}.pdf`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Top bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#818cf8' }}>
            <ListOrdered size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>سجل عروض الأسعار والطلبات</h3>
            <p style={{ fontSize: '0.85rem' }}>متابعة واعتماد عروض الأسعار الصادرة من الموظفين</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: '', label: 'الكل' },
            { id: 'submitted', label: 'بانتظار الموافقة ⏳' },
            { id: 'approved', label: 'معتمدة ✅' },
            { id: 'rejected', label: 'مرفوضة ❌' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`btn btn-sm ${filterStatus === f.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Cards Grid */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري تحميل عروض الأسعار...</div>
        ) : quotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
            <p>لا توجد عروض أسعار مسجلة في هذا القسم حاليًا.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {quotes.map(q => (
              <div
                key={q.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                {/* Left side details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#60a5fa' }}>{q.quote_number}</span>
                    
                    {/* Status Badge */}
                    {q.status === 'approved' && <span className="badge badge-approved"><CheckCircle2 size={12} /> معتمد</span>}
                    {q.status === 'submitted' && <span className="badge badge-submitted"><Clock size={12} /> بانتظار موافقة المدير</span>}
                    {q.status === 'rejected' && <span className="badge badge-rejected"><X size={12} /> مرفوض</span>}

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      • {new Date(q.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>
                    العميل: {q.customer_name} | الموظف: {q.user_name}
                  </p>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    عدد المنتجات: {(q.items || []).length} | الخصم: {q.discount_percent}% ({q.discount_amount.toLocaleString()} EGP)
                  </p>
                </div>

                {/* Right side Amount & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>صافي القيمة:</span>
                    <h4 style={{ fontSize: '1.2rem', color: '#34d399' }}>{q.final_amount.toLocaleString()} EGP</h4>
                  </div>

                  {/* Manager Approval Actions */}
                  {q.status === 'submitted' && user && (user.can_approve || user.role === 'admin' || user.role === 'manager') && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => handleUpdateStatus(q.id, 'approved')}
                        title="اعتماد عرض السعر"
                      >
                        <Check size={16} />
                        <span>موافقة</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleUpdateStatus(q.id, 'rejected')}
                        title="رفض"
                      >
                        <X size={16} />
                        <span>رفض</span>
                      </button>
                    </div>
                  )}

                  {/* Export PDF & Delete */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => exportPDF(q)}
                    title="تحميل ملف PDF"
                  >
                    <Download size={16} />
                    <span>PDF</span>
                  </button>

                  {(user && (user.role === 'admin' || user.id === q.user_id)) && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
