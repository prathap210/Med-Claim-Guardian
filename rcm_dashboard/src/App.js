import React, { useState, useEffect } from 'react';
import ClaimForm from './components/ClaimForm';
import PredictionResult from './components/PredictionResult';
import DenialAnalytics from './components/DenialAnalytics';
import WhatIfSimulation from './components/WhatIfSimulation';
import PayerHeatmap from './components/PayerHeatmap';
import ProofOfValue from './components/ProofOfValue';
import ChatAssistant from './components/ChatAssistant';
import Sidebar from './components/Sidebar';
import axios from 'axios';
import './premium.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Sample analytics data - in a real app, this would come from the backend
  useEffect(() => {
    const mockAnalytics = {
      denialsByPayer: {
        'Star Health':            0.22,
        'HDFC ERGO':              0.28,
        'ICICI Lombard':          0.35,
        'Bajaj Allianz':          0.18,
        'New India Assurance':    0.25,
        'United India Insurance': 0.31,
        'Oriental Insurance':     0.27,
        'National Insurance':     0.29,
        'Niva Bupa':              0.21,
        'Care Health Insurance':  0.24,
        'Tata AIG':               0.33,
        'SBI General Insurance':  0.26,
        'Manipal Cigna Health':   0.19,
        'Reliance Health Insurance': 0.30,
      },
      denialsByProcedure: {
        'PROC_A': 0.15,
        'PROC_B': 0.28,
        'PROC_C': 0.35,
        'PROC_D': 0.42,
        'PROC_E': 0.38,
      },
      denialsByProvider: {
        'Hospital':           0.21,
        'Specialist':         0.34,
        'Clinic':             0.27,
        'Diagnostic Center':  0.41,
      },
      riskDistribution: {
        'Low': 3307,
        'Medium': 1200,
        'High': 493,
      },
      recentPredictions: [
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
      ]
    };
    setAnalytics(mockAnalytics);
  }, []);

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Ambient background glows ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(6,182,212,0.055) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* ══════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════ */}
      <div className="app-content" style={{ marginLeft: sidebarCollapsed ? 72 : 256, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1, transition: 'margin-left 0.28s cubic-bezier(0.4,0,0.2,1)' }}>

        {/* ── Top Bar ── */}
        <header style={{
          height: 68,
          background: 'rgba(8,14,26,0.75)',
          borderBottom: '1px solid rgba(34,211,238,0.07)',
          backdropFilter: 'blur(28px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px 0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
          boxShadow: '0 1px 0 rgba(34,211,238,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        }}>

          {/* Bottom shimmer line */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.22) 30%, rgba(99,102,241,0.18) 70%, transparent)',
            pointerEvents: 'none',
          }} />

          {/* ── LEFT: sidebar toggle + breadcrumb ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: '#334155',
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
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

            {/* Page icon + title + breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {/* Icon bubble */}
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'rgba(34,211,238,0.09)',
                border: '1px solid rgba(34,211,238,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#22D3EE',
                boxShadow: '0 0 12px rgba(34,211,238,0.12)',
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
                <div style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.4px', lineHeight: 1 }}>
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
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />

            {/* Notification bell */}
            <button
              title="Notifications"
              style={{
                width: 36, height: 36, borderRadius: 9, position: 'relative',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: '#334155',
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
                border: '1px solid rgba(34,211,238,0.12)',
                background: 'rgba(34,211,238,0.05)',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              className="hdr-profile-btn"
            >
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'linear-gradient(135deg, #06B6D4, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(6,182,212,0.35)',
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
        <main className="app-main" style={{ flex: 1, padding: '28px 28px 20px', overflowX: 'hidden' }}>

          {/* ── Quick Predict Tab ── */}
          {activeTab === 'predict' && (
            <div className="predict-grid" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 22, alignItems: 'start' }}>

              {/* Form card */}
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '24px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#3B82F6,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📋</div>
                  <div>
                    <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15 }}>Claim Details</div>
                    <div style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Enter patient &amp; claim information</div>
                  </div>
                </div>
                <ClaimForm onSubmit={handleSubmit} isLoading={loading} onReset={() => { setPrediction(null); setError(null); }} />
              </div>

              {/* Results area */}
              <div>
                {/* Loading */}
                {loading && (
                  <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, backdropFilter: 'blur(16px)', boxShadow: '0 4px 32px rgba(0,0,0,0.4)' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #06B6D4', borderTopColor: 'transparent', animation: 'appSpin 0.9s linear infinite', marginBottom: 22 }} />
                    <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 17 }}>Analyzing Claim...</div>
                    <div style={{ color: '#64748B', fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: 300 }}>AI is processing your data with SHAP explainability</div>
                  </div>
                )}

                {/* Error */}
                {!loading && error && (
                  <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(239,68,68,0.25)', borderLeft: '4px solid #EF4444', borderRadius: 16, padding: '22px 24px', backdropFilter: 'blur(16px)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div>
                        <div style={{ color: '#FCA5A5', fontWeight: 700, fontSize: 14, marginBottom: 5 }}>Prediction Failed</div>
                        <div style={{ color: '#94A3B8', fontSize: 12.5, lineHeight: 1.5 }}>{error}</div>
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
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16,
                    minHeight: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '40px 32px',
                  }}>
                    {/* Icon ring */}
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      border: '1.5px solid rgba(34,211,238,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 22,
                      background: 'rgba(34,211,238,0.04)',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', inset: -6, borderRadius: '50%',
                        border: '1px dashed rgba(34,211,238,0.1)',
                      }} />
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
                      </svg>
                    </div>
                    <div style={{ color: '#475569', fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
                      No prediction yet
                    </div>
                    <div style={{ color: '#2D4A5E', fontSize: 12.5, maxWidth: 260, lineHeight: 1.65 }}>
                      Complete the claim form and click <span style={{ color: '#22D3EE', fontWeight: 700 }}>Predict</span> to run AI analysis
                    </div>
                    {/* Hint arrow */}
                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, color: '#1E3A52', fontSize: 11 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                      Fill in the form on the left
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {activeTab === 'analytics' && (
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              {analytics
                ? <DenialAnalytics data={analytics} analytics={analytics} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 256, color: '#06B6D4', fontSize: 17 }}>Loading analytics data...</div>
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
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '13px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: '#334155', fontSize: 11.5 }}>Med-Claim Guardian · Powered by SHAP AI Explainability · GlitchCon 2.0</span>
          <span style={{ color: '#334155', fontSize: 11.5 }}>VIT Chennai · ECDS · Team HEIST</span>
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
          grid-template-columns: 360px 1fr;
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .predict-grid { grid-template-columns: 320px 1fr; gap: 16px; }
        }
        @media (max-width: 820px) {
          .predict-grid { grid-template-columns: 1fr; gap: 20px; }
          .app-main { padding: 18px 16px 16px !important; }
        }
        @media (max-width: 560px) {
          .app-main { padding: 12px 10px 12px !important; }
        }

        /* ── Responsive sidebar shift ───────────────────────── */
        @media (max-width: 820px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
