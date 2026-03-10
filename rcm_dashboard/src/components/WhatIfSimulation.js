import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function WhatIfSimulation() {
  const [formData, setFormData] = useState({
    patient_age: 45,
    insurance_type: 'Private',
    procedure_code: 'PROC_A',
    diagnosis_code: 'DX1',
    provider_type: 'Specialist',
    claim_amount: 5000,
    prior_authorization: 'yes',
    documentation_complete: 'yes',
    coding_accuracy_score: 0.95,
    claim_submission_delay_days: 5,
    payer: 'Star Health',
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scenarios, setScenarios] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/predict`, formData);
      setResults(response.data);
      
      // Add to scenarios
      setScenarios([
        ...scenarios,
        {
          id: scenarios.length + 1,
          name: `Scenario ${scenarios.length + 1}`,
          data: formData,
          result: response.data.denial_probability
        }
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error making prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(value) ? value : parseFloat(value) || value
    }));
  };

  const compareScenarios = () => {
    if (scenarios.length < 2) {
      setError('Create at least 2 scenarios to compare');
      return;
    }
    
    const scenario1 = scenarios[0];
    const scenario2 = scenarios[scenarios.length - 1];
    const diff = scenario2.result - scenario1.result;
    const percentChange = ((diff / scenario1.result) * 100).toFixed(2);

    return { scenario1, scenario2, diff, percentChange };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-8 rounded-2xl">
        <h2 className="text-3xl font-bold text-blue-900 mb-6">
          ⚡ What-If Simulation Engine
        </h2>
        <p className="text-gray-700 mb-6">
          Test different claim scenarios and see how changes affect denial probability
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Patient Age</label>
            <input
              type="range"
              name="patient_age"
              min="18"
              max="100"
              value={formData.patient_age}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700">{formData.patient_age} years</span>
          </div>

          {/* Insurance Type */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Insurance Type</label>
            <select
              name="insurance_type"
              value={formData.insurance_type}
              onChange={handleInputChange}
              className="w-full bg-white text-blue-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Private</option>
              <option>Medicaid</option>
              <option>Medicare</option>
            </select>
          </div>

          {/* Procedure Code */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Procedure Code</label>
            <select
              name="procedure_code"
              value={formData.procedure_code}
              onChange={handleInputChange}
              className="w-full bg-white text-blue-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>PROC_A</option>
              <option>PROC_B</option>
              <option>PROC_C</option>
              <option>PROC_D</option>
              <option>PROC_E</option>
            </select>
          </div>

          {/* Payer */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Payer</label>
            <select
              name="payer"
              value={formData.payer}
              onChange={handleInputChange}
              className="w-full bg-white text-blue-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Star Health</option>
              <option>HDFC ERGO</option>
              <option>ICICI Lombard</option>
              <option>Bajaj Allianz</option>
              <option>New India Assurance</option>
            </select>
          </div>

          {/* Claim Amount */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Claim Amount (₹)</label>
            <input
              type="range"
              name="claim_amount"
              min="1000"
              max="500000"
              value={formData.claim_amount}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700">₹{formData.claim_amount.toLocaleString('en-IN')}</span>
          </div>

          {/* Coding Accuracy */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Coding Accuracy Score</label>
            <input
              type="range"
              name="coding_accuracy_score"
              min="0"
              max="1"
              step="0.05"
              value={formData.coding_accuracy_score}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700">{(formData.coding_accuracy_score * 100).toFixed(0)}%</span>
          </div>

          {/* Documentation */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Documentation Complete</label>
            <select
              name="documentation_complete"
              value={formData.documentation_complete}
              onChange={handleInputChange}
              className="w-full bg-white text-blue-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Prior Authorization */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Prior Authorization</label>
            <select
              name="prior_authorization"
              value={formData.prior_authorization}
              onChange={handleInputChange}
              className="w-full bg-white text-blue-900 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* Submission Delay */}
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Submission Delay (Days)</label>
            <input
              type="range"
              name="claim_submission_delay_days"
              min="0"
              max="60"
              value={formData.claim_submission_delay_days}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-gray-700">{formData.claim_submission_delay_days} days</span>
          </div>
        </form>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Simulate Scenario'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-2xl">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">Current Scenario</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Denial Probability:</span>
                <span className="text-3xl font-bold text-blue-900">
                  {(results.denial_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Risk Level:</span>
                <span className={`text-xl font-bold ${
                  results.risk_level === 'Low' ? 'text-green-600' :
                  results.risk_level === 'Medium' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {results.risk_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Confidence:</span>
                <span className="text-blue-900">{(results.confidence_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {scenarios.length > 1 && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Comparison</h3>
              {compareScenarios() && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Scenario 1 Risk:</span>
                    <span className="text-blue-900">
                      {(compareScenarios().scenario1.result * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Latest Scenario Risk:</span>
                    <span className="text-blue-900">
                      {(compareScenarios().scenario2.result * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between">
                    <span className="text-gray-700">Change:</span>
                    <span className={`text-xl font-bold ${
                      compareScenarios().diff < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {compareScenarios().diff > 0 ? '+' : ''}{(compareScenarios().diff * 100).toFixed(1)}% ({compareScenarios().percentChange}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scenarios History */}
      {scenarios.length > 0 && (
        <div className="bg-white border border-gray-200 p-6 rounded-2xl">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">
            Scenarios ({scenarios.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scenarios.map((scenario, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-700">Scenario {idx + 1}</span>
                <span className={`text-lg font-bold px-3 py-1 rounded ${
                  scenario.result < 0.33 ? 'bg-green-100 text-green-800' :
                  scenario.result < 0.67 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {(scenario.result * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatIfSimulation;
