import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * AnalyticsIntegration.js
 * 
 * Example component showing how to integrate analytics data into the React dashboard
 * This demonstrates fetching analytics from the API and displaying them in various ways
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Hook to fetch analytics data
export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (endpoint = 'summary') => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/analytics/${endpoint}`);
      setAnalytics(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics('summary');
  }, []);

  return { analytics, loading, error, fetchAnalytics };
};

// KPI card accent configs — purely visual, no logic changes
const KPI_CARD_META = [
  {
    key: 'total',
    label: 'Total Claims',
    accent: '#22D3EE',
    glow: 'rgba(34,211,238,0.18)',
    bgFrom: 'rgba(34,211,238,0.10)',
    bgTo:   'rgba(34,211,238,0.02)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
    ),
  },
  {
    key: 'denial',
    label: 'Denial Rate',
    accent: '#F87171',
    glow: 'rgba(248,113,113,0.18)',
    bgFrom: 'rgba(248,113,113,0.10)',
    bgTo:   'rgba(248,113,113,0.02)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
  },
  {
    key: 'approval',
    label: 'Approval Rate',
    accent: '#34D399',
    glow: 'rgba(52,211,153,0.18)',
    bgFrom: 'rgba(52,211,153,0.10)',
    bgTo:   'rgba(52,211,153,0.02)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    key: 'amount',
    label: 'Avg Claim Amount',
    accent: '#A78BFA',
    glow: 'rgba(167,139,250,0.18)',
    bgFrom: 'rgba(124,58,237,0.12)',
    bgTo:   'rgba(124,58,237,0.02)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

// Example 1: KPI Cards Component
export const KPICards = ({ analytics }) => {
  if (!analytics?.overall) return null;

  const overall = analytics.overall;

  const cardData = [
    {
      ...KPI_CARD_META[0],
      value: overall.total_claims.toLocaleString(),
      sub: 'Across all payers',
    },
    {
      ...KPI_CARD_META[1],
      value: overall.denial_rate_percent,
      sub: `${overall.denied_claims.toLocaleString()} claims denied`,
    },
    {
      ...KPI_CARD_META[2],
      value: overall.approval_rate_percent,
      sub: `${overall.approved_claims.toLocaleString()} claims approved`,
    },
    {
      ...KPI_CARD_META[3],
      value: `₹${(overall.avg_claim_amount / 100000).toFixed(1)}L`,
      sub: `Total: ₹${(overall.total_claim_amount / 10000000).toFixed(1)}Cr`,
    },
  ];

  return (
    <>
      <style>{`
        .kpi-analytics-card {
          position: relative;
          border-radius: 16px;
          padding: 22px 24px 20px;
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease,
                      border-color 0.22s ease;
          cursor: default;
          backdrop-filter: blur(12px);
        }
        .kpi-analytics-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            var(--kpi-accent) 0%,
            transparent 55%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
                        linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.55;
          pointer-events: none;
        }
        .kpi-analytics-card::after {
          content: '';
          position: absolute;
          top: -30%;
          right: -10%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--kpi-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .kpi-analytics-card:hover {
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 20px 48px var(--kpi-glow), 0 4px 12px rgba(0,0,0,0.4);
          border-color: var(--kpi-accent) !important;
        }
        .kpi-icon-ring {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .kpi-analytics-card:hover .kpi-icon-ring {
          transform: scale(1.12);
        }
        .kpi-value-text {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .kpi-label-text {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #94A3B8;
        }
        .kpi-sub-text {
          font-size: 11.5px;
          color: #64748B;
          margin-top: 6px;
          line-height: 1.4;
        }
        .kpi-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, var(--kpi-accent), transparent);
          opacity: 0.2;
          margin: 14px 0 12px;
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {cardData.map((card) => (
          <div
            key={card.label}
            className="kpi-analytics-card"
            style={{
              '--kpi-accent': card.accent,
              '--kpi-glow':   card.glow,
              background: `linear-gradient(145deg, ${card.bgFrom}, ${card.bgTo})`,
              border: `1px solid ${card.accent}2E`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 ${card.accent}18`,
            }}
          >
            {/* Header row: label + icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span className="kpi-label-text">{card.label}</span>
              <div
                className="kpi-icon-ring"
                style={{
                  background: `${card.accent}18`,
                  border: `1px solid ${card.accent}30`,
                  color: card.accent,
                }}
              >
                {card.icon}
              </div>
            </div>

            {/* Primary value */}
            <p
              className="kpi-value-text"
              style={{ color: card.accent }}
            >
              {card.value}
            </p>

            <div className="kpi-divider" />

            {/* Sub label */}
            <p className="kpi-sub-text">{card.sub}</p>
          </div>
        ))}
      </div>
    </>
  );
};

// Example 2: Top Procedures Table
export const TopProceduresTable = ({ procedures }) => {
  if (!procedures) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Top Procedures with Highest Denial Rate
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Procedure</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total Claims</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Denied</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Denial Rate</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((proc) => (
              <tr key={proc.procedure_code} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-bold text-gray-700">{proc.rank}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{proc.procedure_code}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{proc.total_claims}</td>
                <td className="py-3 px-4 text-sm text-gray-700">{proc.denied_claims}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`font-semibold ${
                    proc.denial_rate > 0.35 ? 'text-red-600' :
                    proc.denial_rate > 0.30 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {proc.denial_rate_percent}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Example 3: Payer Performance Chart Data
export const PayerPerformanceData = ({ payers }) => {
  if (!payers) return null;

  return {
    labels: payers.map(p => p.payer),
    datasets: [
      {
        label: 'Denial Rate (%)',
        data: payers.map(p => p.denial_rate * 100),
        backgroundColor: payers.map(p => 
          p.denial_rate > 0.35 ? 'rgba(239, 68, 68, 0.6)' :
          p.denial_rate > 0.33 ? 'rgba(249, 115, 22, 0.6)' :
          'rgba(34, 197, 94, 0.6)'
        ),
        borderColor: payers.map(p =>
          p.denial_rate > 0.35 ? 'rgba(239, 68, 68, 1)' :
          p.denial_rate > 0.33 ? 'rgba(249, 115, 22, 1)' :
          'rgba(34, 197, 94, 1)'
        ),
        borderWidth: 2
      }
    ]
  };
};

// Example 4: Insights from Claim Amount Comparison
export const ClaimAmountInsights = ({ comparison }) => {
  if (!comparison?.denied_claims) return null;

  const denied = comparison.denied_claims;
  const approved = comparison.approved_claims;
  const comp = comparison.comparison;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Claim Amount Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Denied Claims */}
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h4 className="font-semibold text-red-900 mb-3">Denied Claims</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Count:</span>
              <span className="font-semibold">{denied.count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Average:</span>
              <span className="font-semibold">₹{denied.avg_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Median:</span>
              <span className="font-semibold">₹{denied.median_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Range:</span>
              <span className="font-semibold">
                ₹{denied.min_amount.toFixed(0)} - ₹{denied.max_amount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Approved Claims */}
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h4 className="font-semibold text-green-900 mb-3">Approved Claims</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Count:</span>
              <span className="font-semibold">{approved.count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Average:</span>
              <span className="font-semibold">₹{approved.avg_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Median:</span>
              <span className="font-semibold">₹{approved.median_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Range:</span>
              <span className="font-semibold">
                ₹{approved.min_amount.toFixed(0)} - ₹{approved.max_amount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
        <p className="text-sm text-yellow-900">
          <strong>Insight:</strong> Denied claims are on average{' '}
          <span className="font-semibold">{comp.avg_amount_difference_percent}</span> higher
          (₹{comp.avg_amount_difference.toFixed(2)}) than approved claims, suggesting claim
          amount may be a denial factor.
        </p>
      </div>
    </div>
  );
};

// Example 5: Main Analytics Dashboard Component
export const AnalyticsDashboardPage = () => {
  const { analytics, loading, error } = useAnalytics();

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading analytics: {error}</div>;
  }

  if (!analytics) {
    return <div className="p-8 text-center">No analytics data available</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Claims Analytics Dashboard</h1>

      {/* KPI Section */}
      <div className="mb-8">
        <KPICards analytics={analytics} />
      </div>

      {/* Top Procedures Section */}
      <div className="mb-8">
        <TopProceduresTable procedures={analytics.top_procedures} />
      </div>

      {/* Claim Amount Analysis */}
      <div className="mb-8">
        <ClaimAmountInsights comparison={analytics.claim_amount_comparison} />
      </div>

      {/* Payer Performance Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Denial Rate by Payer</h3>
        <div className="space-y-3">
          {analytics.denial_by_payer?.map(payer => (
            <div key={payer.payer} className="flex items-center justify-between p-3 border rounded">
              <span className="font-medium">{payer.payer}</span>
              <div className="flex items-center gap-4">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      payer.denial_rate > 0.35 ? 'bg-red-500' :
                      payer.denial_rate > 0.33 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${payer.denial_rate * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold w-16 text-right">
                  {payer.denial_rate_percent}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
