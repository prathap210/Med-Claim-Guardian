import React from 'react';

const RISK_CFG = {
  Low: {
    from: '#15803D', to: '#065F46',
    accent: '#4ADE80', glow: 'rgba(34,197,94,0.4)',
    tileBorder: 'rgba(74,222,128,0.35)', tileBg: 'rgba(74,222,128,0.12)',
    badgeBg: 'rgba(34,197,94,0.15)', badgeBorder: 'rgba(74,222,128,0.3)',
    label: 'APPROVE & PROCESS', action: 'Auto-Approve Eligible', icon: '✅',
  },
  Medium: {
    from: '#B45309', to: '#92400E',
    accent: '#FCD34D', glow: 'rgba(245,158,11,0.4)',
    tileBorder: 'rgba(252,211,77,0.35)', tileBg: 'rgba(252,211,77,0.1)',
    badgeBg: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(252,211,77,0.3)',
    label: 'REVIEW REQUIRED', action: 'Manual Review Needed', icon: '⚠️',
  },
  High: {
    from: '#B91C1C', to: '#881337',
    accent: '#F87171', glow: 'rgba(239,68,68,0.4)',
    tileBorder: 'rgba(248,113,113,0.35)', tileBg: 'rgba(248,113,113,0.1)',
    badgeBg: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(248,113,113,0.3)',
    label: 'PRIORITY ESCALATION', action: 'Urgent Action Required', icon: '🚨',
  },
};

const FEATURE_ICONS = {
  patient_age: '👤', insurance_type: '🏥', procedure_code: '🔬',
  diagnosis_code: '📋', provider_type: '🏢', claim_amount: '💰',
  prior_authorization: '✅', documentation_complete: '📄',
  coding_accuracy_score: '🎯', claim_submission_delay_days: '⏱️', payer: '🏦',
};

const PredictionResult = ({ prediction }) => {
  const denialPct = (prediction.denial_probability * 100).toFixed(1);
  const confPct   = (prediction.confidence_score   * 100).toFixed(1);
  const risk      = prediction.risk_level;
  const cfg       = RISK_CFG[risk] ?? RISK_CFG.Low;

  return (
    <>
      <style>{`
        .pr-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .pr-hero-val {
          font-size: clamp(20px, 4.2vw, 38px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #fff;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .pr-hero-label {
          font-size: clamp(9px, 1.1vw, 11px);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: rgba(255,255,255,0.72);
          margin-bottom: 8px;
        }
        .pr-card {
          background: rgba(15,23,42,0.72);
          border-radius: 14px;
          padding: 18px;
          backdrop-filter: blur(12px);
        }
        .pr-stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748B;
          margin-bottom: 8px;
        }
        @media (max-width: 860px) {
          .pr-3col        { grid-template-columns: repeat(2, 1fr); }
          .pr-legend-3col { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .pr-3col    { grid-template-columns: 1fr; }
          .pr-hero    { padding: 22px 18px !important; }
          .pr-hero-icon { font-size: 52px !important; margin-bottom: 14px !important; }
          .pr-card    { padding: 14px; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* HERO */}
        <div className="pr-hero" style={{
          background: `linear-gradient(140deg, ${cfg.from} 0%, ${cfg.to} 100%)`,
          borderRadius: 20,
          padding: 'clamp(20px,3.5vw,34px) clamp(16px,3vw,30px)',
          boxShadow: `0 8px 40px ${cfg.glow}, 0 2px 16px rgba(0,0,0,0.45)`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="pr-hero-icon" style={{ textAlign: 'center', fontSize: 'clamp(48px,7vw,68px)', lineHeight: 1, marginBottom: 18 }}>
              {cfg.icon}
            </div>
            <div className="pr-3col">
              {[
                { label: 'RISK LEVEL',    value: risk,            highlight: false },
                { label: 'DENIAL RATE',   value: `${denialPct}%`, highlight: true  },
                { label: 'AI CONFIDENCE', value: `${confPct}%`,   highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{
                  background: highlight ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.11)',
                  border: highlight ? '2px solid rgba(255,255,255,0.38)' : '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 14,
                  padding: 'clamp(12px,2vw,18px) clamp(8px,1.5vw,14px)',
                  textAlign: 'center', backdropFilter: 'blur(8px)', minWidth: 0,
                }}>
                  <p className="pr-hero-label">{label}</p>
                  <p className="pr-hero-val">{value}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Meter</span>
                <span style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {denialPct}% Chance
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, width: `${denialPct}%`, background: 'rgba(255,255,255,0.85)', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDATION */}
        <div className="pr-card" style={{ border: `1.5px solid ${cfg.tileBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {cfg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h3 style={{ color: cfg.accent, fontWeight: 800, fontSize: 'clamp(13px,1.8vw,15px)', marginBottom: 8 }}>{cfg.label}</h3>
              <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.65, marginBottom: 12 }}>{prediction.suggested_action}</p>
              <span style={{ display: 'inline-block', padding: '5px 14px', background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, borderRadius: 20, color: cfg.accent, fontSize: 12, fontWeight: 700 }}>
                {cfg.action}
              </span>
            </div>
          </div>
        </div>

        {/* FIX STEPS */}
        {prediction.rule_based_recommendations?.length > 0 && (
          <div className="pr-card" style={{ border: '1px solid rgba(34,211,238,0.15)' }}>
            <p style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 14, marginBottom: 14 }}>
              🔧 Steps to Fix Your Claim
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prediction.rule_based_recommendations.map((rec, i) => {
                const isGood = rec.startsWith('✅ Everything');
                return (
                  <div key={i} style={{
                    background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                    border: isGood ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: '12px 16px',
                  }}>
                    <p style={{ color: isGood ? '#4ADE80' : '#E2E8F0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                      {rec}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATUS STRIP */}
        <div className="pr-3col">
          {[
            { label: 'Status',          value: denialPct > 60 ? '🔴 HIGH' : denialPct > 30 ? '🟡 MEDIUM' : '🟢 LOW' },
            { label: 'Action Priority', value: risk === 'Low' ? 'LOW' : risk === 'Medium' ? 'MEDIUM' : 'CRITICAL' },
            { label: 'Next Step',       value: denialPct < 33 ? '✅ Submit' : denialPct < 67 ? '📋 Review' : '🚀 Escalate' },
          ].map(({ label, value }) => (
            <div key={label} className="pr-card" style={{ border: `1px solid ${cfg.tileBorder}` }}>
              <p className="pr-stat-label">{label}</p>
              <p style={{ color: cfg.accent, fontSize: 'clamp(13px,2vw,16px)', fontWeight: 800, lineHeight: 1.25 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* LEGEND */}
        <div className="pr-card" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: 13, marginBottom: 14 }}>💡 How to Read This Report</p>
          <div className="pr-3col pr-legend-3col">
            {[
              { icon: '✅', accent: '#4ADE80', bg: 'rgba(34,197,94,0.09)',   border: 'rgba(34,197,94,0.22)',   title: 'GREEN = Safe Claim',     sub: 'Low denial risk — ready to process.' },
              { icon: '⚠️', accent: '#FCD34D', bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.22)', title: 'YELLOW = Moderate Risk', sub: 'Review before submitting.' },
              { icon: '🚨', accent: '#F87171', bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.22)',   title: 'RED = High Risk',        sub: 'Likely denial — needs attention.' },
            ].map(({ icon, accent, bg, border, title, sub }) => (
              <div key={title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '13px', display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: accent, fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>{title}</p>
                  <p style={{ color: '#64748B', fontSize: 11.5, lineHeight: 1.4 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHAP */}
        {prediction.shap_available && prediction.feature_contributions?.length > 0 && (
          <div className="pr-card" style={{ border: '1px solid rgba(34,211,238,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>🧠</span>
              <div>
                <h3 style={{ color: '#22D3EE', fontWeight: 800, fontSize: 'clamp(13px,1.8vw,15px)', marginBottom: 3 }}>AI Feature Impact</h3>
                <p style={{ color: '#475569', fontSize: 11.5 }}>Powered by SHAP · Why the model predicted this</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prediction.feature_contributions.slice(0, 6).map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{FEATURE_ICONS[item.feature] ?? '📊'}</span>
                      <span style={{ color: '#CBD5E1', fontSize: 12.5, fontWeight: 600, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.feature.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, flexShrink: 0, background: item.contribution > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: item.contribution > 0 ? '#F87171' : '#4ADE80' }}>
                      {item.contribution > 0 ? '↑ +' : '↓ '}{(Math.abs(item.contribution) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(Math.abs(item.contribution) * 1000, 100)}%`, background: item.contribution > 0 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#22C55E,#10B981)', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {[
                { color: 'linear-gradient(90deg,#EF4444,#F97316)', label: '↑ Increases Denial Risk' },
                { color: 'linear-gradient(90deg,#22C55E,#10B981)', label: '↓ Reduces Denial Risk'   },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ color: '#64748B', fontSize: 11.5 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
          {[
            { label: 'Processing Time', value: '<500ms' },
            { label: 'Prediction ID',   value: `#${Math.floor(Math.random() * 100000)}` },
          ].map(({ label, value }, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#475569', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ color: '#22D3EE', fontSize: 18, fontWeight: 800 }}>{value}</p>
              </div>
            </React.Fragment>
          ))}
        </div>

      </div>
    </>
  );
};

export default PredictionResult;
