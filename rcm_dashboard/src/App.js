import React, { useState, useEffect } from 'react';
import ClaimForm from './components/ClaimForm';
import PredictionResult from './components/PredictionResult';
import DenialAnalytics from './components/DenialAnalytics';
import WhatIfSimulation from './components/WhatIfSimulation';
import PayerHeatmap from './components/PayerHeatmap';
import ProofOfValue from './components/ProofOfValue';
import ChatAssistant from './components/ChatAssistant';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';
import './premium.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 820);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 820;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback mock data used only if real API is unavailable
  const MOCK_RECENT_PREDICTIONS = [
    { id: 1,  payer: 'Star Health',               amount: 5000,  risk: 'Low',    probability: 0.18 },
    { id: 2,  payer: 'ICICI Lombard',             amount: 25000, risk: 'High',   probability: 0.72 },
    { id: 3,  payer: 'HDFC ERGO',                 amount: 12000, risk: 'Medium', probability: 0.51 },
    { id: 4,  payer: 'Bajaj Allianz',             amount: 45000, risk: 'Medium', probability: 0.58 },
    { id: 5,  payer: 'New India Assurance',       amount: 8000,  risk: 'Low',    probability: 0.25 },
    { id: 6,  payer: 'United India Insurance',    amount: 15000, risk: 'Medium', probability: 0.53 },
    { id: 7,  payer: 'Oriental Insurance',        amount: 9500,  risk: 'Medium', probability: 0.47 },
    { id: 8,  payer: 'National Insurance',        amount: 22000, risk: 'Medium', probability: 0.49 },
    { id: 9,  payer: 'Niva Bupa',                 amount: 18000, risk: 'Low',    probability: 0.21 },
    { id: 10, payer: 'Care Health Insurance',     amount: 11000, risk: 'Low',    probability: 0.24 },
    { id: 11, payer: 'Tata AIG',                  amount: 33000, risk: 'High',   probability: 0.68 },
    { id: 12, payer: 'SBI General Insurance',     amount: 7500,  risk: 'Medium', probability: 0.46 },
    { id: 13, payer: 'Manipal Cigna Health',      amount: 14000, risk: 'Low',    probability: 0.19 },
    { id: 14, payer: 'Reliance Health Insurance', amount: 29000, risk: 'Medium', probability: 0.55 },
  ];

  // Load real analytics from the backend; fall back to mock data if unavailable
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics`);
        const real = response.data;

        // Transform backend format → component format
        const denialsByPayer = {};
        (real.denial_by_payer || []).forEach(d => { denialsByPayer[d.payer] = d.denial_rate; });

        const denialsByProcedure = {};
        (real.top_procedures_by_denial || []).forEach(d => { denialsByProcedure[d.procedure_code] = d.denial_rate; });

        const denialsByProvider = {};
        (real.denial_by_provider_type || []).forEach(d => { denialsByProvider[d.provider_type] = d.denial_rate; });

        const stats = real.overall_statistics || {};
        const approved = stats.approved_claims || 3307;
        const denied   = stats.denied_claims   || 1693;
        const riskDistribution = {
          'Low':    Math.round(approved * 0.66),
          'Medium': Math.round(approved * 0.34),
          'High':   denied,
        };

        setAnalytics({
          denialsByPayer,
          denialsByProcedure,
          denialsByProvider,
          riskDistribution,
          recentPredictions: MOCK_RECENT_PREDICTIONS,
        });
      } catch (err) {
        // Fallback to static mock data if backend is unreachable
        setAnalytics({
          denialsByPayer: {
            'Star Health': 0.22, 'HDFC ERGO': 0.28, 'ICICI Lombard': 0.35,
            'Bajaj Allianz': 0.18, 'New India Assurance': 0.25,
          },
          denialsByProcedure: { 'PROC_A': 0.32, 'PROC_B': 0.36, 'PROC_C': 0.34, 'PROC_D': 0.40, 'PROC_E': 0.39 },
          denialsByProvider: { 'Hospital': 0.35, 'Specialist': 0.33, 'Clinic': 0.34, 'Diagnostic Center': 0.34 },
          riskDistribution: { 'Low': 2181, 'Medium': 1126, 'High': 1693 },
          recentPredictions: MOCK_RECENT_PREDICTIONS,
        });
      }
    };
    fetchAnalytics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/predict`, formData);
      setPrediction(response.data);
      
      // Update analytics with new prediction (mock data)
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
      setError(err.response?.data?.detail || 'Failed to get prediction. Make sure the API is running at http://localhost:8000');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const PAGE_META = {
    predict:    { title: 'Quick Predict',        sub: 'AI-powered claim denial prediction with SHAP explainability',  icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    )},
    simulation: { title: 'What-If Simulation',   sub: 'Test scenarios and compare claim outcomes side-by-side', icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
    )},
    heatmap:    { title: 'Payer Risk Heatmap',   sub: 'Visualise denial rates across payers and procedures', icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )},
    analytics:  { title: 'Analytics Dashboard',  sub: 'Historical denial patterns and insights', icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    )},
    proof:      { title: 'ROI & Proof of Value',  sub: 'Business value metrics and ROI calculator', icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    )},
    chat:       { title: 'AI Assistant',          sub: 'Intelligent healthcare billing assistant', icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    )},
  };

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-light-bg)', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Clean minimal background ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0, background: 'linear-gradient(135deg, var(--color-light-bg) 0%, #f1f8fb 100%)' }} />

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        isMobile={isMobile}
      />

      {/* Mobile overlay backdrop — dims content when sidebar drawer is open */}
      {isMobile && !sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, cursor: 'pointer' }}
        />
      )}

      {/* ══════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════ */}
      <div className="app-content" style={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 256), flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1, transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* ── Top Bar ── */}
        <header style={{
          height: 68,
          background: 'var(--color-white)',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}>

          {/* Bottom clean border */}

          {/* ── LEFT: sidebar toggle + breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid rgba(15, 76, 129, 0.12)',
                background: 'rgba(15, 76, 129, 0.04)',
                color: 'var(--color-medical-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s ease',
              }}
              className="hdr-icon-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: 'rgba(15, 76, 129, 0.1)', flexShrink: 0 }} />

            {/* Page icon + title + breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {/* Icon bubble */}
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'rgba(15, 76, 129, 0.08)',
                border: '1px solid rgba(15, 76, 129, 0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-medical-blue)',
              }}>
                {PAGE_META[activeTab]?.icon}
              </div>
              <div>
                {/* Breadcrumb path — only shows section context, title is below */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <span style={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px' }}>Dashboard</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <span style={{ color: '#64748B', fontSize: 10, fontWeight: 500, letterSpacing: '0.2px' }}>
                    {PAGE_META[activeTab]?.sub?.split('·')[0]?.trim() || 'Overview'}
                  </span>
                </div>
                {/* Page title — unique text, not repeated from breadcrumb */}
                <div style={{ color: 'var(--color-medical-blue)', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.4px', lineHeight: 1 }}>
                  {PAGE_META[activeTab]?.title}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: status chips + notification + profile ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Status chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* API */}
              <div style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(34,197,94,0.07)',
                border: '1px solid rgba(34,197,94,0.18)',
                color: '#22C55E', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
                letterSpacing: '0.2px',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block', boxShadow: '0 0 5px #22C55E', animation: 'hdrPulse 2s ease-in-out infinite' }} />
                API
              </div>
              {/* Model */}
              <div style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(6,182,212,0.07)',
                border: '1px solid rgba(6,182,212,0.18)',
                color: '#06B6D4', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
                letterSpacing: '0.2px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                RF · 72.2%
              </div>
              {/* SHAP */}
              <div style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.18)',
                color: '#818CF8', fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 5,
                letterSpacing: '0.2px',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                SHAP
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: 'rgba(15, 76, 129, 0.1)', margin: '0 4px' }} />

            {/* Notification bell */}
            <button
              title="Notifications"
              style={{
                width: 36, height: 36, borderRadius: 9, position: 'relative',
                border: '1px solid rgba(15, 76, 129, 0.12)',
                background: 'rgba(15, 76, 129, 0.04)',
                color: 'var(--color-medical-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              className="hdr-icon-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* Badge */}
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 7, height: 7, borderRadius: '50%',
                background: '#EF4444',
                border: '1.5px solid #0A1121',
                boxShadow: '0 0 6px rgba(239,68,68,0.7)',
              }} />
            </button>

            {/* User profile */}
            <button
              title="Team HEIST"
              style={{
                height: 36, borderRadius: 9, padding: '0 10px 0 6px',
                border: '1px solid rgba(15, 76, 129, 0.12)',
                background: 'rgba(15, 76, 129, 0.05)',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              className="hdr-profile-btn"
            >
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'linear-gradient(135deg, var(--color-accent-teal), var(--color-medical-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>TH</div>
              {/* Name + role */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#CBD5E1', fontSize: 11.5, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Team HEIST</div>
                <div style={{ color: '#64748B', fontSize: 9.5, lineHeight: 1, whiteSpace: 'nowrap' }}>GlitchCon 2.0</div>
              </div>
              {/* Chevron */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          {/* Hover + animation styles */}
          <style>{`
            .hdr-icon-btn:hover {
              background: rgba(34,211,238,0.08) !important;
              border-color: rgba(34,211,238,0.22) !important;
              color: #22D3EE !important;
              box-shadow: 0 0 12px rgba(34,211,238,0.15) !important;
            }
            .hdr-profile-btn:hover {
              background: rgba(34,211,238,0.1) !important;
              border-color: rgba(34,211,238,0.28) !important;
              box-shadow: 0 0 14px rgba(34,211,238,0.12) !important;
            }
            @keyframes hdrPulse {
              0%,100% { opacity:1; box-shadow: 0 0 5px #22C55E; }
              50%      { opacity:0.5; box-shadow: 0 0 2px #22C55E; }
            }
          `}</style>
        </header>

        {/* ── Page Content ── */}
        <main className="app-main" style={{ flex: 1, padding: '32px 40px 28px', overflowX: 'hidden', background: '#fafbfc' }}>

          {/* ── Quick Predict Tab ── */}
          {activeTab === 'predict' && (
            <div className="predict-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start', maxWidth: '100%' }}>

              {/* Form card */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0F4C81,#008BA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#fff', fontWeight: 700 }}>📋</div>
                  <div>
                    <div style={{ color: '#0F4C81', fontWeight: 700, fontSize: 17 }}>Claim Information</div>
                    <div style={{ color: '#7c8ba0', fontSize: 13.5, marginTop: 4 }}>Enter patient and claim details</div>
                  </div>
                </div>
                <ClaimForm onSubmit={handleSubmit} isLoading={loading} onReset={() => { setPrediction(null); setError(null); }} />
              </div>

              {/* Results area */}
              <div>
                {/* Loading */}
                {loading && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '64px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#0F4C81', animation: 'appSpin 0.9s linear infinite', marginBottom: 28 }} />
                    <div style={{ color: '#0F4C81', fontWeight: 600, fontSize: 16 }}>Analyzing Claim...</div>
                    <div style={{ color: '#7c8ba0', fontSize: 13.5, marginTop: 12, textAlign: 'center', maxWidth: 320 }}>Running denial prediction with SHAP analysis</div>
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 14, padding: '28px 32px', boxShadow: '0 1px 3px rgba(220,38,38,0.06)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>⚠️</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#991b1b', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Prediction Error</div>
                        <div style={{ color: '#7f1d1d', fontSize: 13.5, lineHeight: 1.6 }}>{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prediction result — key forces full unmount/remount when prediction changes */}
                {!loading && prediction && (
                  <PredictionResult key={JSON.stringify(prediction)} prediction={prediction} />
                )}

                {/* Empty state — shown only before any submission */}
                {!loading && !error && !prediction && (
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px dashed #e2e8f0',
                    borderRadius: 14,
                    minHeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '56px 44px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}>
                    {/* Icon ring */}
                    <div style={{
                      width: 88, height: 88, borderRadius: '50%',
                      border: '2px solid #0F4C81',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 28,
                      background: 'rgba(15, 76, 129, 0.05)',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', inset: -10, borderRadius: '50%',
                        border: '1px dashed rgba(15, 76, 129, 0.15)',
                      }} />
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0F4C81" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                      </svg>
                    </div>
                    <div style={{ color: '#1f2937', fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
                      Submit a Claim for Analysis
                    </div>
                    <div style={{ color: '#7c8ba0', fontSize: 14, maxWidth: 300, lineHeight: 1.8 }}>
                      Fill in the claim details and click <span style={{ color: '#0F4C81', fontWeight: 600 }}>Predict</span> to run AI-powered denial risk assessment
                    </div>
                    {/* Hint arrow */}
                    <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10, color: '#a0aec0', fontSize: 13 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                      Complete form on left
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === 'analytics' && (
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', minHeight: 600 }}>
              {analytics
                ? <DenialAnalytics data={analytics} analytics={analytics} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 600, color: '#0F4C81', fontSize: 15, fontWeight: 500 }}>Generating analytics...</div>
              }
            </div>
          )}

          {/* ── What-If Simulation Tab ── */}
          {activeTab === 'simulation' && <WhatIfSimulation />}

          {/* ── Payer Heatmap Tab ── */}
          {activeTab === 'heatmap' && <PayerHeatmap />}

          {/* ── Proof of Value Tab ── */}
          {activeTab === 'proof' && <ProofOfValue />}

        </main>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid #e2e8f0', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#fafbfc', fontSize: '12px', color: '#7c8ba0' }}>
          <span>Med-Claim Guardian · AI Denial Risk Prediction · Powered by SHAP</span>
          <span>Team HEIST</span>
        </footer>
      </div>

      {/* ── Chat overlay (full screen, above everything) ── */}
      {activeTab === 'chat' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: '#0f172a' }}>
          <ChatAssistant onBack={() => setActiveTab('predict')} />
        </div>
      )}

      <style>{`
        @keyframes appSpin { to { transform: rotate(360deg); } }

        /* ── Responsive predict layout ─────────────────────── */
        .predict-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .predict-grid { grid-template-columns: 1fr 1fr; gap: 28px; }
          .app-main { padding: 28px 32px 24px !important; }
        }
        @media (max-width: 820px) {
          .predict-grid { grid-template-columns: 1fr; gap: 24px; }
          .app-main { padding: 24px 20px 18px !important; }
        }
        @media (max-width: 560px) {
          .app-main { padding: 16px 14px 12px !important; }
        }

        /* ── Responsive sidebar shift ───────────────────────── */
        @media (max-width: 820px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
      </div>
    </ErrorBoundary>
  );
}

export default App;
