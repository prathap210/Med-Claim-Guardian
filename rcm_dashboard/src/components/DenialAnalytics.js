import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DenialAnalytics = ({ data, analytics }) => {
  const chartData = data || analytics;
  if (!chartData || !chartData.denialsByPayer) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-cyan-400 text-xl">Loading analytics...</div>
      </div>
    );
  }
  const resolvedData = chartData;

  // Denial trends by payer
  // Generate unique colours for any number of payers
  const PALETTE_BG = [
    'rgba(59,130,246,0.6)',   'rgba(110,65,228,0.6)',  'rgba(236,72,153,0.6)',
    'rgba(249,115,22,0.6)',   'rgba(34,197,94,0.6)',   'rgba(20,184,166,0.6)',
    'rgba(245,158,11,0.6)',   'rgba(239,68,68,0.6)',   'rgba(99,102,241,0.6)',
    'rgba(16,185,129,0.6)',   'rgba(217,70,239,0.6)',  'rgba(251,191,36,0.6)',
    'rgba(14,165,233,0.6)',   'rgba(168,85,247,0.6)',
  ];
  const PALETTE_BORDER = PALETTE_BG.map((c) => c.replace('0.6', '1'));
  const payerCount = Object.keys(resolvedData.denialsByPayer).length;
  const bgColors     = Array.from({ length: payerCount }, (_, i) => PALETTE_BG[i % PALETTE_BG.length]);
  const borderColors = Array.from({ length: payerCount }, (_, i) => PALETTE_BORDER[i % PALETTE_BORDER.length]);

  const payerChartData = {
    labels: Object.keys(resolvedData.denialsByPayer),
    datasets: [
      {
        label: 'Denial Rate',
        data: Object.values(resolvedData.denialsByPayer).map((v) => v * 100),
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  // Denial trends by procedure
  const procedureChartData = {
    labels: Object.keys(resolvedData.denialsByProcedure),
    datasets: [
      {
        label: 'Denial Rate (%)',
        data: Object.values(resolvedData.denialsByProcedure).map((v) => v * 100),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  // Denial by provider
  const providerChartData = {
    labels: Object.keys(resolvedData.denialsByProvider || {
      'Hospital': 0.21, 'Specialist': 0.34, 'Clinic': 0.27, 'Diagnostic Center': 0.41,
    }),
    datasets: [
      {
        label: 'Denial Rate (%)',
        data: Object.values(resolvedData.denialsByProvider || {
          'Hospital': 0.21, 'Specialist': 0.34, 'Clinic': 0.27, 'Diagnostic Center': 0.41,
        }).map((v) => v * 100),
        backgroundColor: [
          'rgba(34,197,94,0.6)',
          'rgba(249,115,22,0.6)',
          'rgba(59,130,246,0.6)',
          'rgba(239,68,68,0.6)',
        ],
        borderColor: [
          'rgba(34,197,94,1)',
          'rgba(249,115,22,1)',
          'rgba(59,130,246,1)',
          'rgba(239,68,68,1)',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // Risk distribution
  const riskDistributionData = {
    labels: Object.keys(resolvedData.riskDistribution),
    datasets: [
      {
        label: 'Number of Claims',
        data: Object.values(resolvedData.riskDistribution),
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: { size: 12, weight: 'bold' },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(34, 211, 238, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-xl rounded-lg border border-cyan-400/50">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
            Analytics & Insights
          </h2>
          <p className="text-sm text-white/60">Real-time denial trends and claim analytics</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-400/30 rounded-xl p-6 hover:border-green-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-300 text-sm font-semibold">Average Denial Rate</p>
            <span className="text-2xl">📉</span>
          </div>
          <p className="text-4xl font-bold text-green-300">
            {(
              Object.values(resolvedData.denialsByPayer).reduce((a, b) => a + b, 0) / 
              Object.values(resolvedData.denialsByPayer).length * 100
            ).toFixed(1)}%
          </p>
          <p className="text-xs text-white/50 mt-2">Across all payers</p>
        </div>

        <div className="group backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-400/30 rounded-xl p-6 hover:border-red-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-300 text-sm font-semibold">High Risk Claims</p>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-red-300">
            {resolvedData.riskDistribution.High}
          </p>
          <p className="text-xs text-white/50 mt-2">Requires attention</p>
        </div>

        <div className="group backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 rounded-xl p-6 hover:border-purple-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-purple-300 text-sm font-semibold">Total Claims</p>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-4xl font-bold text-purple-300">
            {Object.values(resolvedData.riskDistribution).reduce((a, b) => a + b, 0).toLocaleString()}
          </p>
          <p className="text-xs text-white/50 mt-2">In database</p>
        </div>

        <div className="group backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-400/30 rounded-xl p-6 hover:border-emerald-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-emerald-300 text-sm font-semibold">Approval Rate</p>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-4xl font-bold text-emerald-300">
            {(
              100 - (
                Object.values(resolvedData.denialsByPayer).reduce((a, b) => a + b, 0) / 
                Object.values(resolvedData.denialsByPayer).length * 100
              )
            ).toFixed(1)}%
          </p>
          <p className="text-xs text-white/50 mt-2">Expected success</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Denial by Payer */}
        <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:bg-white/[0.12]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏦</span>
            <h3 className="text-lg font-bold text-cyan-300">Denial by Payer</h3>
          </div>
          <Bar data={payerChartData} options={chartOptions} height={300} />
        </div>

        {/* Denial by Procedure */}
        <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:bg-white/[0.12]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔬</span>
            <h3 className="text-lg font-bold text-cyan-300">Procedure Trends</h3>
          </div>
          <Line data={procedureChartData} options={chartOptions} height={300} />
        </div>

        {/* Risk Distribution */}
        <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:bg-white/[0.12]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h3 className="text-lg font-bold text-cyan-300">Risk Distribution</h3>
          </div>
          <Doughnut data={riskDistributionData} options={chartOptions} height={300} />
        </div>
      </div>

      {/* Provider Chart — full width row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:bg-white/[0.12]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏢</span>
            <h3 className="text-lg font-bold text-cyan-300">Denial by Provider Type</h3>
          </div>
          <p className="text-xs text-white/50 mb-4">Denial rate breakdown across healthcare provider categories</p>
          <Bar data={providerChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              legend: { display: false },
            },
            scales: {
              ...chartOptions.scales,
              y: {
                ...chartOptions.scales.y,
                max: 60,
                ticks: {
                  ...chartOptions.scales.y.ticks,
                  callback: (v) => v + '%',
                },
              },
            },
          }} height={220} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(resolvedData.denialsByProvider || { 'Hospital': 0.21, 'Specialist': 0.34, 'Clinic': 0.27, 'Diagnostic Center': 0.41 }).map(([provider, rate]) => (
              <div key={provider} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-xs text-white/70">{provider}</span>
                <span className={`text-xs font-bold ${
                  rate < 0.25 ? 'text-green-300' : rate < 0.35 ? 'text-amber-300' : 'text-red-300'
                }`}>{(rate * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider insight card */}
        <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/10 hover:bg-white/[0.12]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-bold text-cyan-300">Provider Insights</h3>
          </div>
          <p className="text-xs text-white/50 mb-5">Key observations from provider-level denial analysis</p>
          <div className="space-y-4">
            {[
              { icon: '🏥', label: 'Hospitals', rate: 0.21, note: 'Lowest denial rate — strong documentation compliance' },
              { icon: '🔬', label: 'Specialists', rate: 0.34, note: 'Higher denials due to complex procedure coding' },
              { icon: '🏪', label: 'Clinics', rate: 0.27, note: 'Moderate — often missing prior authorization' },
              { icon: '🧪', label: 'Diagnostic Centers', rate: 0.41, note: 'Highest risk — frequent diagnosis-procedure mismatches' },
            ].map(({ icon, label, rate, note }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white/90">{label}</span>
                    <span className={`text-sm font-bold ${
                      rate < 0.25 ? 'text-green-300' : rate < 0.35 ? 'text-amber-300' : 'text-red-300'
                    }`}>{(rate * 100).toFixed(0)}% denial</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mb-1.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${rate * 100}%`,
                      background: rate < 0.25 ? '#22d3ee' : rate < 0.35 ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <p className="text-xs text-white/50">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-cyan-300">Recent Predictions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-5 text-xs font-bold text-cyan-300 uppercase tracking-wider">ID</th>
                <th className="text-left py-4 px-5 text-xs font-bold text-cyan-300 uppercase tracking-wider">Payer</th>
                <th className="text-left py-4 px-5 text-xs font-bold text-cyan-300 uppercase tracking-wider">Claim Amount</th>
                <th className="text-left py-4 px-5 text-xs font-bold text-cyan-300 uppercase tracking-wider">Risk Level</th>
                <th className="text-left py-4 px-5 text-xs font-bold text-cyan-300 uppercase tracking-wider">Probability</th>
              </tr>
            </thead>
            <tbody>
              {resolvedData.recentPredictions.map((pred, idx) => (
                <tr 
                  key={pred.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 group/row"
                >
                  <td className="py-4 px-5 text-sm text-white/80 font-medium group-hover/row:text-cyan-300">#<span className="font-bold">{pred.id}</span></td>
                  <td className="py-4 px-5 text-sm text-white/80 group-hover/row:text-cyan-300">
                    <div className="flex items-center gap-2">
                      <span>{pred.payer}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-sm font-semibold text-white/90 group-hover/row:text-green-300">
                    ₹{pred.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-5 text-sm">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl transition-all duration-200 ${
                      pred.risk === 'Low' ? 'bg-green-500/30 text-green-300 border border-green-400/50' :
                      pred.risk === 'Medium' ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' :
                      'bg-red-500/30 text-red-300 border border-red-400/50'
                    }`}>
                      {pred.risk === 'Low' ? '✅' : pred.risk === 'Medium' ? '⚠️' : '🚨'} {pred.risk}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
                    {(pred.probability * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DenialAnalytics;
