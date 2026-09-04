import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AIChatAssistant from './components/AIChatAssistant';
import QuoteBuilder from './components/QuoteBuilder';
import QuotesList from './components/QuotesList';
import PriceListManager from './components/PriceListManager';
import CRMManager from './components/CRMManager';
import AdminPermissions from './components/AdminPermissions';
import ServerConfigModal from './components/ServerConfigModal';
import LoginModal from './components/LoginModal';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('ai');
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [prefilledDraft, setPrefilledDraft] = useState(null);

  const handleNavigateToBuilderWithDraft = (draft) => {
    setPrefilledDraft(draft);
    setActiveTab('builder');
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenServerModal={() => setServerModalOpen(true)}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
        {activeTab === 'ai' && (
          <AIChatAssistant onNavigateToBuilder={handleNavigateToBuilderWithDraft} />
        )}

        {activeTab === 'builder' && (
          <QuoteBuilder prefilledDraft={prefilledDraft} onQuoteCreated={() => setActiveTab('quotes')} />
        )}

        {activeTab === 'quotes' && (
          <QuotesList />
        )}

        {activeTab === 'pricelist' && (
          <PriceListManager />
        )}

        {activeTab === 'crm' && (
          <CRMManager />
        )}

        {activeTab === 'admin' && (
          <AdminPermissions />
        )}
      </main>

      <ServerConfigModal
        isOpen={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
