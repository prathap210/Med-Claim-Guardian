import React, { useRef, useState, useEffect } from 'react';

/* ── SVG icon set (feather-style, 24×24) ─────────────────────── */
const NAV_ICONS = {
  predict: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  simulation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  heatmap: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  proof: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'predict',    label: 'Quick Predict', desc: 'AI denial forecast',  badge: null      },
  { id: 'simulation', label: 'What-If Sim',   desc: 'Scenario engine',    badge: null      },
  { id: 'heatmap',    label: 'Payer Heatmap', desc: 'Risk visualisation', badge: null      },
  { id: 'analytics',  label: 'Analytics',     desc: 'Denial intelligence', badge: 'LIVE'   },
  { id: 'proof',      label: 'ROI & Value',   desc: 'Business impact',    badge: null      },
  { id: 'chat',       label: 'AI Assistant',  desc: 'Ask anything',       badge: 'AI'      },
];

const STATUS_ITEMS = [
  { label: 'API Server',  status: 'Live',    color: '#22C55E' },
  { label: 'ML Model',    status: 'Active',  color: '#22C55E' },
  { label: 'SHAP Engine', status: 'Ready',   color: '#06B6D4' },
  { label: 'Claims DB',   status: '5K Rows', color: '#F59E0B' },
];

/* ── Component ──────────────────────────────────────────────────
   Props:
     activeTab   – current active tab id  (read-only, from App)
     setActiveTab – tab setter             (nav handler, unchanged)
     collapsed   – boolean                (from App state)
     onToggle    – () => void             (from App, flips collapsed)
────────────────────────────────────────────────────────────────── */
export default function Sidebar({ activeTab, setActiveTab, collapsed, onToggle, isMobile }) {
  const W = collapsed ? 72 : 256;

  /* Rail indicator: track each nav button's offsetTop */
  const navRef = useRef(null);
  const btnRefs = useRef({});
  const [railTop, setRailTop] = useState(0);
  const [railH, setRailH]     = useState(46);

  useEffect(() => {
    const el = btnRefs.current[activeTab];
    if (el) {
      setRailTop(el.offsetTop);
      setRailH(el.offsetHeight);
    }
  }, [activeTab, collapsed]);

  return (
    <>
      <style>{`
        .mcg-sidebar {
          transition: width 0.3s ease;
          overflow: hidden;
        }

        .mcg-nav-btn {
          transition: background 0.2s ease, color 0.2s ease;
        }

        .mcg-nav-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .mcg-nav-btn.mcg-active {
          background: #f0f7ff;
          color: #0F4C81;
          font-weight: 600;
        }

        .mcg-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: all 0.2s ease;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .mcg-nav-btn.mcg-active .mcg-icon-wrap {
          background: #dbeafe;
          border-color: #0F4C81;
          color: #0F4C81;
        }

        .mcg-nav-btn:hover .mcg-icon-wrap {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .mcg-tip {
          position: absolute;
          left: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          background: #1f2937;
          border: 1px solid #e5e7eb;
          color: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          padding: 7px 13px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .mcg-nav-btn:hover .mcg-tip {
          opacity: 1;
        }

        .mcg-toggle {
          transition: all 0.2s ease;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          color: #6b7280;
          cursor: pointer;
          padding: 6px;
        }

        .mcg-toggle:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #374151;
        }

        .mcg-pulse {
          animation: mcgPulse 2s ease-in-out infinite;
        }

        @keyframes mcgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .mcg-rail {
          position: absolute;
          left: 0;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background: #0F4C81;
          transition: top 0.3s ease, height 0.3s ease;
          pointer-events: none;
        }
      `}</style>

      <aside
        className="mcg-sidebar"
        style={{
          width: W,
          minHeight: '100vh',
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 100,
          boxShadow: '1px 0 2px rgba(0,0,0,0.05)',
          transform: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        {/* Logo header */}
        <div style={{
          padding: collapsed ? '1rem 0' : '1rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
          flexShrink: 0,
          background: '#f9fafb',
        }}>
          {/* Left: logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {/* Logo */}
            <div style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: '#0F4C81',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
              border: '1px solid #0F4C81',
              fontWeight: 'bold',
            }}>
              📋
            </div>

            {/* Wordmark — hidden when collapsed */}
            {!collapsed && (
              <div style={{ overflow: 'hidden', minWidth: 0 }}>
                <div style={{ color: '#1f2937', fontWeight: 700, fontSize: 14, letterSpacing: '-0.5px', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
                  Med-Claim Guardian
                </div>
                <div style={{ color: '#9ca3af', fontSize: 8, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 2, whiteSpace: 'nowrap' }}>
                  AI Platform
                </div>
              </div>
            )}
          </div>

          {/* Collapse button (expanded only) */}
          {!collapsed && (
            <button
              className="mcg-toggle"
              onClick={onToggle}
              title="Collapse sidebar"
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
                color: '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Expand button (collapsed state) */}
        {collapsed && (
          <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <button
              className="mcg-toggle"
              onClick={onToggle}
              title="Expand sidebar"
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
                color: '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Nav section label */}
        {!collapsed && (
          <div style={{ padding: '12px 12px 8px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</span>
          </div>
        )}

        {/* Nav items */}
        <nav ref={navRef} style={{ flex: 1, padding: collapsed ? '8px 8px' : '8px 8px', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

          {/* Sliding active rail */}
          {!collapsed && (
            <div className="mcg-rail" style={{ top: railTop, height: railH }} />
          )}

          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={el => { btnRefs.current[item.id] = el; }}
                className={`mcg-nav-btn${isActive ? ' mcg-active' : ''}`}
                onClick={() => { setActiveTab(item.id); if (isMobile && !collapsed) onToggle(); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '11px 0' : '9px 12px 9px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 3,
                  background: 'transparent',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Icon container */}
                <span className="mcg-icon-wrap">
                  {NAV_ICONS[item.id]}
                </span>

                {/* Label + desc (expanded only) */}
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: isActive ? '#22D3EE' : '#5E7A96',
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      letterSpacing: isActive ? '-0.2px' : '0.1px',
                      transition: 'color 0.2s ease',
                    }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#475569', fontSize: 10.5, marginTop: 2, whiteSpace: 'nowrap' }}>
                      {item.desc}
                    </div>
                  </div>
                )}

                {/* Badge (expanded) */}
                {!collapsed && item.badge && (
                  <span style={{
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #e0f2fe',
                    flexShrink: 0,
                  }}>
                    {item.badge}
                  </span>
                )}

                {/* Tooltip (collapsed) */}
                {collapsed && <span className="mcg-tip">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Status section */}
        {!collapsed ? (
          <div style={{ padding: '12px 12px 10px', borderTop: '1px solid #e5e7eb', flexShrink: 0, background: '#f9fafb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</span>
            </div>
            {STATUS_ITEMS.map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#374151', fontSize: 11, fontWeight: 500 }}>{s.label}</span>
                <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  Online
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px 0 8px', borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            {STATUS_ITEMS.map(s => (
              <div key={s.label} title={`${s.label}: Online`}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}
              />
            ))}
          </div>
        )}

        {/* Footer badge */}
        <div style={{ padding: collapsed ? '8px 0 16px' : '8px 12px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'center', flexShrink: 0 }}>
          {collapsed ? (
            <div title="Claim Detection AI System" style={{ display: 'flex', justifyContent: 'center', fontSize: 18 }}>
              📊
            </div>
          ) : (
            <div style={{
              padding: '8px 10px',
              background: '#f0f9ff',
              border: '1px solid #e0f2fe',
              borderRadius: 8,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ color: '#0369a1', fontSize: 10, fontWeight: 700, letterSpacing: '0.2px' }}>Med-Claim Guardian</div>
              <div style={{ color: '#6b7280', fontSize: 8.5, marginTop: 2 }}>v1.0</div>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}
