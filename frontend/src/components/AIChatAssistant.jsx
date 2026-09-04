import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AIChatAssistant({ onNavigateToBuilder }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `أهلاً بك يا ${user ? user.name : 'فريق العمل'}! 🤖\nأنا مساعد المبيعات الذكي الخاص بشركتك.\nيمكنك أن تطلب مني أي شيء يتعلق بأسعار المنتجات، إنشاء عروض الأسعار، حساب الخصومات، أو مراجعة بيانات العملاء.`
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const msg = textToSend || inputMsg;
    if (!msg.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: msg
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setLoading(true);

    try {
      const res = await api.aiChat(msg);
      if (res.success) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.reply,
          action: res.action,
          draftQuote: res.draftQuote,
          data: res.data
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `عذراً، حدث خطأ أثناء التواصل مع خادم المساعد الذكي: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "🔍 ابحث عن أسعار الكابلات والمولدات",
    "📝 اعمل عرض سعر لمنتج PRD-101 لعدد 2 بخصم 10%",
    "🛡️ كم حد الخصم المسموح لي وصلاحياتي؟",
    "👥 عرض قائمة العملاء الحالية"
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 10px' }}>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', minHeight: '550px' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: 'var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', color: '#60a5fa' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>المساعد الذكي للمبيعات (Smart Sales AI)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>أكتب باللغة العربية أو الإنجليزية للبحث، حساب الخصومات، وإنشاء العروض</p>
          </div>
        </div>

        {/* Messages Chat Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={20} color="#fff" />
                </div>
              )}

              <div style={{
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(30, 41, 59, 0.85)',
                color: '#fff',
                padding: '14px 18px',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                whiteSpace: 'pre-line',
                lineHeight: '1.7',
                fontSize: '0.95rem'
              }}>
                {msg.text}

                {/* Draft Quote Action Button */}
                {msg.action === 'CREATE_QUOTE_DRAFT' && msg.draftQuote && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => onNavigateToBuilder(msg.draftQuote)}
                      style={{ width: '100%' }}
                    >
                      <FileText size={16} />
                      <span>فتح العرض في منشئ عروض الأسعار وتصديره PDF</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} color="#94a3b8" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color="#fff" />
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.85)', padding: '12px 18px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري معالجة طلبك وحساب الأسعار...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: '8px', overflowX: 'auto', borderTop: 'var(--glass-border)' }}>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.15)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div style={{ padding: '16px 20px', borderTop: 'var(--glass-border)' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '12px' }}
          >
            <input
              type="text"
              className="input-field"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="اكتب استفسارك أو طلب عرض سعر هنا..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !inputMsg.trim()}>
              <Send size={18} />
              <span>إرسال</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
