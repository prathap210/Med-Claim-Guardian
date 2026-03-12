import React, { useState, useEffect } from 'react';
import ClaimForm from './components/ClaimForm';
import PredictionResult from './components/PredictionResult';
import DenialAnalytics from './components/DenialAnalytics';
import WhatIfSimulation from './components/WhatIfSimulation';
import PayerHeatmap from './components/PayerHeatmap';
import ProofOfValue from './components/ProofOfValue';
import ChatAssistant from './components/ChatAssistant';
import Sidebar from './components/Sidebar';
import Landing from './components/Landing';
import Login from './components/Login';
import Register from './components/Register';
import OAuthCallback from './components/OAuthCallback';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';
import './premium.css';
import './glass-liquid.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'login', 'register', 'dashboard'
  const [userName, setUserName] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 820);

  // Check if user is already logged in
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedName = localStorage.getItem('userName');
    if (authToken) {
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      setUserName(storedName || 'User');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 820;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock data
  const MOCK_RECENT_PREDICTIONS = [
    { id: 1, payer: 'Star Health', amount: 5000, risk: 'Low', probability: 0.18 },
    { id: 2, payer: 'ICICI Lombard', amount: 25000, risk: 'High', probability: 0.72 },
    { id: 3, payer: 'HDFC ERGO', amount: 12000, risk: 'Medium', probability: 0.51 },
    { id: 4, payer: 'Bajaj Allianz', amount: 45000, risk: 'Medium', probability: 0.58 },
    { id: 5, payer: 'New India Assurance', amount: 8000, risk: 'Low', probability: 0.25 },
    { id: 6, payer: 'United India Insurance', amount: 15000, risk: 'Medium', probability: 0.53 },
    { id: 7, payer: 'Oriental Insurance', amount: 9500, risk: 'Medium', probability: 0.47 },
    { id: 8, payer: 'National Insurance', amount: 22000, risk: 'Medium', probability: 0.49 },
    { id: 9, payer: 'Niva Bupa', amount: 18000, risk: 'Low', probability: 0.21 },
    { id: 10, payer: 'Care Health Insurance', amount: 11000, risk: 'Low', probability: 0.24 },
    { id: 11, payer: 'Tata AIG', amount: 33000, risk: 'High', probability: 0.68 },
    { id: 12, payer: 'SBI General Insurance', amount: 7500, risk: 'Medium', probability: 0.46 },
    { id: 13, payer: 'Manipal Cigna Health', amount: 14000, risk: 'Low', probability: 0.19 },
    { id: 14, payer: 'Reliance Health Insurance', amount: 29000, risk: 'Medium', probability: 0.55 },
  ];

  // Load analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics`);
        const real = response.data;

        const denialsByPayer = {};
        (real.denial_by_payer || []).forEach(d => { denialsByPayer[d.payer] = d.denial_rate; });

        const denialsByProcedure = {};
        (real.top_procedures_by_denial || []).forEach(d => { denialsByProcedure[d.procedure_code] = d.denial_rate; });

        const denialsByProvider = {};
        (real.denial_by_provider_type || []).forEach(d => { denialsByProvider[d.provider_type] = d.denial_rate; });

        const stats = real.overall_statistics || {};
        const approved = stats.approved_claims || 3307;
        const denied = stats.denied_claims || 1693;
        const riskDistribution = {
          'Low': Math.round(approved * 0.66),
          'Medium': Math.round(approved * 0.34),
          'High': denied,
        };

        setAnalytics({
          denialsByPayer,
          denialsByProcedure,
          denialsByProvider,
          riskDistribution,
          recentPredictions: MOCK_RECENT_PREDICTIONS,
        });
      } catch (err) {
        setAnalytics({
          denialsByPayer: { 'Star Health': 0.22, 'HDFC ERGO': 0.28, 'ICICI Lombard': 0.35, 'Bajaj Allianz': 0.18, 'New India Assurance': 0.25 },
          denialsByProcedure: { 'PROC_A': 0.32, 'PROC_B': 0.36, 'PROC_C': 0.34, 'PROC_D': 0.40, 'PROC_E': 0.39 },
          denialsByProvider: { 'Hospital': 0.35, 'Specialist': 0.33, 'Clinic': 0.34, 'Diagnostic Center': 0.34 },
          riskDistribution: { 'Low': 2181, 'Medium': 1126, 'High': 1693 },
          recentPredictions: MOCK_RECENT_PREDICTIONS,
        });
      }
    };
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/predict`, formData);
      setPrediction(response.data);
      
      if (analytics) {
        const newPrediction = {
          id: analytics.recentPredictions.length + 1,
          payer: formData.payer,
          amount: formData.claim_amount,
          risk: response.data.risk_level,
          probability: response.data.denial_probability
        };
        setAnalytics({
          ...analytics,
          recentPredictions: [newPrediction, ...analytics.recentPredictions.slice(0, 9)]
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to get prediction. Make sure the API is running at ${API_URL}`);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    setUserName(localStorage.getItem('userName') || 'User');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userOrganization');
    setIsAuthenticated(false);
    setCurrentPage('landing');
    setUserName('');
  };

  const PAGE_META = {
    predict: { title: 'Quick Predict', sub: 'AI-powered claim denial prediction with SHAP explainability' },
    simulation: { title: 'What-If Simulation', sub: 'Test scenarios and compare claim outcomes side-by-side' },
    heatmap: { title: 'Payer Risk Heatmap', sub: 'Visualise denial rates across payers and procedures' },
    analytics: { title: 'Analytics Dashboard', sub: 'Historical denial patterns and insights' },
    proof: { title: 'ROI & Proof of Value', sub: 'Business value metrics and ROI calculator' },
    chat: { title: 'AI Assistant', sub: 'Intelligent healthcare billing assistant' },
  };

  // Show appropriate page based on current state
  if (!isAuthenticated) {
    // Check if on OAuth callback URL
    const isOAuthCallback = window.location.pathname.includes('/auth/callback/');
    
    if (isOAuthCallback) {
      return <OAuthCallback onAuthSuccess={handleLoginSuccess} />;
    }

    if (currentPage === 'landing') {
      return (
        <Landing
          onClickLogin={() => setCurrentPage('login')}
          onClickRegister={() => setCurrentPage('register')}
        />
      );
    }

    if (currentPage === 'register') {
      return (
        <Register
          onRegisterSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setCurrentPage('login')}
          onBackToHome={() => setCurrentPage('landing')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setCurrentPage('register')}
        onBackToHome={() => setCurrentPage('landing')}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-light-bg)', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        {/* Background */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0, background: 'linear-gradient(135deg, var(--color-light-bg) 0%, #f1f8fb 100%)' }} />

        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          isMobile={isMobile}
        />

        {/* Mobile overlay */}
        {isMobile && !sidebarCollapsed && (
          <div
            onClick={() => setSidebarCollapsed(true)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, cursor: 'pointer' }}
          />
        )}

        {/* Main Content */}
        <div className="app-content" style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 256), flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1, transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>

          {/* Top Bar */}
          <header style={{ height: 68, background: 'var(--color-white)', borderBottom: '1px solid var(--color-gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-gray-900)' }}>{PAGE_META[activeTab].title}</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>{PAGE_META[activeTab].sub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '8px 16px', background: 'var(--color-gray-100)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--color-gray-700)', fontWeight: 500 }}>
                {userName}
              </div>
              <button
                onClick={handleLogout}
                style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                Logout
              </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {error && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
                {error}
              </div>
            )}

            {activeTab === 'predict' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <ClaimForm onSubmit={handleSubmit} loading={loading} />
                {prediction && <PredictionResult prediction={prediction} />}
              </div>
            )}

            {activeTab === 'simulation' && <WhatIfSimulation />}
            {activeTab === 'heatmap' && analytics && <PayerHeatmap analytics={analytics} />}
            {activeTab === 'analytics' && analytics && <DenialAnalytics analytics={analytics} />}
            {activeTab === 'proof' && <ProofOfValue />}
            {activeTab === 'chat' && <ChatAssistant />}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
