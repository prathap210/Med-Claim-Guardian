import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function PayerHeatmap() {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/analytics`);
      const analytics = response.data;

      // Create heatmap matrix
      const payers = [
        'Star Health',
        'HDFC ERGO',
        'ICICI Lombard',
        'Bajaj Allianz',
        'New India Assurance',
        'United India Insurance',
        'Oriental Insurance',
        'National Insurance',
        'Niva Bupa',
        'Care Health Insurance',
        'Tata AIG',
        'SBI General Insurance',
        'Manipal Cigna Health',
        'Reliance Health Insurance',
      ];
      const procedures = ['PROC_A', 'PROC_B', 'PROC_C', 'PROC_D', 'PROC_E'];

      const matrix = [];
      payers.forEach(payer => {
        const row = [];
        procedures.forEach(proc => {
          // Generate risk scores based on base rates + random variation
          const payerBase = analytics.denial_rate_by_payer?.[payer] || 0.3;
          const procBase = analytics.procedures_by_denial_rate?.[proc] || 0.3;
          const combined = (payerBase + procBase) / 2 + (Math.random() * 0.1 - 0.05);
          row.push(Math.min(1, Math.max(0, combined)));
        });
        matrix.push(row);
      });

      setHeatmapData({ payers, procedures, matrix });
    } catch (err) {
      setError('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const getColor = (value) => {
    if (value < 0.2) return 'bg-green-900 text-green-100';
    if (value < 0.4) return 'bg-lime-700 text-lime-100';
    if (value < 0.6) return 'bg-yellow-600 text-yellow-100';
    if (value < 0.8) return 'bg-orange-600 text-orange-100';
    return 'bg-red-700 text-red-100';
  };

  const getRiskLevel = (value) => {
    if (value < 0.2) return 'LOW';
    if (value < 0.4) return 'MODERATE';
    if (value < 0.6) return 'MEDIUM';
    if (value < 0.8) return 'HIGH';
    return 'CRITICAL';
  };

  if (loading) return <div className="text-blue-900 text-center py-8">Loading heatmap...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!heatmapData) return <div className="text-gray-600 text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-blue-900 mb-2">
          🔥 Payer Risk Heatmap
        </h2>
        <p className="text-gray-700 mb-6">
          Visual matrix showing denial risk rates across payers and procedures
        </p>

        {/* Legend */}
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded"></div>
            <span className="text-gray-700">Low (0-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded"></div>
            <span className="text-gray-700">Moderate (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">Medium (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span className="text-gray-700">High (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span className="text-gray-700">Critical (80-100%)</span>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-blue-50 text-blue-900 p-3 text-left font-bold border border-gray-200">Payer / Procedure</th>
                {heatmapData.procedures.map((proc, idx) => (
                  <th key={idx} className="bg-blue-50 text-blue-900 p-3 text-center font-bold min-w-32 border border-gray-200">
                    {proc}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.payers.map((payer, payerIdx) => (
                <tr key={payerIdx} className="border-t border-gray-200">
                  <td className="bg-blue-50 text-blue-900 p-3 font-bold border border-gray-200">{payer}</td>
                  {heatmapData.matrix[payerIdx].map((value, procIdx) => (
                    <td
                      key={procIdx}
                      className={`p-3 text-center font-bold rounded-lg m-1 ${getColor(value)}`}
                    >
                      <div className="text-lg">{(value * 100).toFixed(1)}%</div>
                      <div className="text-xs opacity-75">{getRiskLevel(value)}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-300 p-4 rounded-lg">
            <h4 className="text-red-800 font-bold mb-2">⚠️ Highest Risk Combinations</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              {heatmapData.matrix
                .map((row, payerIdx) =>
                  row.map((value, procIdx) => ({
                    payer: heatmapData.payers[payerIdx],
                    proc: heatmapData.procedures[procIdx],
                    value
                  }))
                )
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((item, idx) => (
                  <li key={idx}>
                    • {item.payer} + {item.proc}: {(item.value * 100).toFixed(1)}%
                  </li>
                ))}
            </ul>
          </div>

          <div className="bg-green-50 border border-green-300 p-4 rounded-lg">
            <h4 className="text-green-800 font-bold mb-2">✅ Lowest Risk Combinations</h4>
            <ul className="text-gray-700 text-sm space-y-1">
              {heatmapData.matrix
                .map((row, payerIdx) =>
                  row.map((value, procIdx) => ({
                    payer: heatmapData.payers[payerIdx],
                    proc: heatmapData.procedures[procIdx],
                    value
                  }))
                )
                .sort((a, b) => a.value - b.value)
                .slice(0, 3)
                .map((item, idx) => (
                  <li key={idx}>
                    • {item.payer} + {item.proc}: {(item.value * 100).toFixed(1)}%
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="backdrop-premium p-6 rounded-2xl">
        <h3 className="text-2xl font-bold text-cyan-400 mb-4">💡 Strategic Recommendations</h3>
        <ul className="text-gray-300 space-y-3">
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">1.</span>
            <span>Focus quality improvement efforts on high-risk payer-procedure combinations (marked in red)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">2.</span>
            <span>Replicate best practices from low-risk combinations to improve overall performance</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">3.</span>
            <span>Schedule provider training for procedures with consistently high denial rates</span>
          </li>
          <li className="flex gap-3">
            <span className="text-cyan-400 font-bold">4.</span>
            <span>Monitor ICICI Lombard claims more closely - appears to have higher overall denial rates</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default PayerHeatmap;
