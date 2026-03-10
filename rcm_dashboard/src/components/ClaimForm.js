import React, { useState } from 'react';

const CATEGORICAL_OPTIONS = {
  insurance_type: ['Private', 'Medicaid', 'Medicare', 'UnitedHealthcare', 'Blue Cross Blue Shield', 'Aetna', 'Cigna', 'Humana', 'Molina Healthcare', 'Centene'],
  procedure_code: ['PROC_A', 'PROC_B', 'PROC_C', 'PROC_D', 'PROC_E'],
  diagnosis_code: ['DX1', 'DX2', 'DX3', 'DX4', 'DX5'],
  provider_type: ['Hospital', 'Specialist', 'Clinic', 'Diagnostic Center'],
  prior_authorization: ['yes', 'no'],
  documentation_complete: ['yes', 'no'],
  payer: [
    'Star Health',
    'HDFC ERGO',
    'ICICI Lombard',
    'New India Assurance',
    'Bajaj Allianz',
    'United India Insurance',
    'Oriental Insurance',
    'National Insurance',
    'Niva Bupa',
    'Care Health Insurance',
    'Tata AIG',
    'SBI General Insurance',
    'Manipal Cigna Health',
    'Reliance Health Insurance',
  ],
};

const FIELD_ICONS = {
  patient_age: '👤',
  insurance_type: '🏥',
  procedure_code: '🔬',
  diagnosis_code: '📋',
  provider_type: '🏢',
  claim_amount: '💰',
  prior_authorization: '✅',
  documentation_complete: '📄',
  coding_accuracy_score: '🎯',
  claim_submission_delay_days: '⏱️',
  payer: '🏦',
};

const FIELD_DESCRIPTIONS = {
  patient_age: 'Patient age at time of claim',
  insurance_type: 'Type of insurance coverage',
  procedure_code: 'Medical procedure code',
  diagnosis_code: 'Primary diagnosis code',
  provider_type: 'Healthcare provider category',
  claim_amount: 'Total claim amount in rupees',
  prior_authorization: 'Prior authorization obtained',
  documentation_complete: 'All documentation provided',
  coding_accuracy_score: 'Medical coding accuracy (0-100%)',
  claim_submission_delay_days: 'Days delayed from service date',
  payer: 'Insurance payer company',
};

// Real-world coding accuracy: based on procedure-diagnosis compatibility
// Matches how hospital billing software validates ICD/CPT code pairs
const CODING_ACCURACY_MAP = {
  'PROC_A': { 'DX1': 0.97, 'DX2': 0.91, 'DX3': 0.55, 'DX4': 0.42, 'DX5': 0.38 },
  'PROC_B': { 'DX1': 0.48, 'DX2': 0.95, 'DX3': 0.93, 'DX4': 0.50, 'DX5': 0.41 },
  'PROC_C': { 'DX1': 0.45, 'DX2': 0.52, 'DX3': 0.96, 'DX4': 0.92, 'DX5': 0.44 },
  'PROC_D': { 'DX1': 0.40, 'DX2': 0.47, 'DX3': 0.53, 'DX4': 0.94, 'DX5': 0.90 },
  'PROC_E': { 'DX1': 0.93, 'DX2': 0.44, 'DX3': 0.46, 'DX4': 0.51, 'DX5': 0.95 },
};

const calculateCodingAccuracy = (procedureCode, diagnosisCode, documentationComplete) => {
  const base = (CODING_ACCURACY_MAP[procedureCode] || {})[ diagnosisCode] ?? 0.70;
  const docPenalty = documentationComplete === 'no' ? 0.15 : 0;
  return Math.max(0.10, parseFloat((base - docPenalty).toFixed(2)));
};

const ClaimForm = ({ onSubmit, onReset, isLoading }) => {
  const [formData, setFormData] = useState(() => {
    const defaults = {
      patient_age: 45,
      insurance_type: 'Private',
      procedure_code: 'PROC_A',
      diagnosis_code: 'DX1',
      provider_type: 'Specialist',
      claim_amount: 5000,
      prior_authorization: 'yes',
      documentation_complete: 'yes',
      claim_submission_delay_days: 5,
      payer: 'Star Health',
    };
    return {
      ...defaults,
      coding_accuracy_score: calculateCodingAccuracy(defaults.procedure_code, defaults.diagnosis_code, defaults.documentation_complete),
    };
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['patient_age', 'claim_amount', 'claim_submission_delay_days'];
    const updated = {
      ...formData,
      [name]: numericFields.includes(name) ? parseFloat(value) || value : value,
    };
    // Auto-recalculate coding accuracy when relevant fields change
    if (['procedure_code', 'diagnosis_code', 'documentation_complete'].includes(name)) {
      updated.coding_accuracy_score = calculateCodingAccuracy(
        updated.procedure_code,
        updated.diagnosis_code,
        updated.documentation_complete
      );
    }
    setFormData(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const resetForm = () => {
    const defaults = {
      patient_age: 45,
      insurance_type: 'Private',
      procedure_code: 'PROC_A',
      diagnosis_code: 'DX1',
      provider_type: 'Specialist',
      claim_amount: 5000,
      prior_authorization: 'yes',
      documentation_complete: 'yes',
      claim_submission_delay_days: 5,
      payer: 'Star Health',
    };
    setFormData({
      ...defaults,
      coding_accuracy_score: calculateCodingAccuracy(defaults.procedure_code, defaults.diagnosis_code, defaults.documentation_complete),
    });
    if (onReset) onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient Age */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.patient_age}</span>
          Patient Age
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.patient_age}</p>
        <input
          type="number"
          name="patient_age"
          value={formData.patient_age}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          min="1"
          max="120"
          required
        />
      </div>

      {/* Insurance Type */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.insurance_type}</span>
          Insurance Type
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.insurance_type}</p>
        <select
          name="insurance_type"
          value={formData.insurance_type}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.insurance_type.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Procedure Code */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.procedure_code}</span>
          Procedure Code
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.procedure_code}</p>
        <select
          name="procedure_code"
          value={formData.procedure_code}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.procedure_code.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Diagnosis Code */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.diagnosis_code}</span>
          Diagnosis Code
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.diagnosis_code}</p>
        <select
          name="diagnosis_code"
          value={formData.diagnosis_code}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.diagnosis_code.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Provider Type */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.provider_type}</span>
          Provider Type
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.provider_type}</p>
        <select
          name="provider_type"
          value={formData.provider_type}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.provider_type.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Claim Amount */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.claim_amount}</span>
          Claim Amount (₹)
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.claim_amount}</p>
        <input
          type="number"
          name="claim_amount"
          value={formData.claim_amount}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Prior Authorization */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.prior_authorization}</span>
          Prior Authorization
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.prior_authorization}</p>
        <select
          name="prior_authorization"
          value={formData.prior_authorization}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.prior_authorization.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt === 'yes' ? 'Yes' : 'No'}
            </option>
          ))}
        </select>
      </div>

      {/* Documentation Complete */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.documentation_complete}</span>
          Documentation Complete
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.documentation_complete}</p>
        <select
          name="documentation_complete"
          value={formData.documentation_complete}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.documentation_complete.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt === 'yes' ? 'Yes' : 'No'}
            </option>
          ))}
        </select>
      </div>

      {/* Coding Accuracy Score — Auto-calculated, not editable */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2">
          <span className="text-xl">{FIELD_ICONS.coding_accuracy_score}</span>
          Coding Accuracy Score
          <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Auto-calculated</span>
        </label>
        <p className="text-xs text-white/60 mb-3">Automatically determined by procedure–diagnosis code compatibility</p>
        <div className="flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg cursor-not-allowed">
          <div className="flex-1 h-2 rounded-full bg-white/10 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(formData.coding_accuracy_score * 100).toFixed(0)}%`,
                background: formData.coding_accuracy_score >= 0.85
                  ? 'linear-gradient(to right, #22d3ee, #3b82f6)'
                  : formData.coding_accuracy_score >= 0.60
                  ? 'linear-gradient(to right, #f59e0b, #f97316)'
                  : 'linear-gradient(to right, #f87171, #ef4444)',
              }}
            />
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-center w-16 border ${
            formData.coding_accuracy_score >= 0.85
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
              : formData.coding_accuracy_score >= 0.60
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              : 'bg-red-500/20 border-red-400/50 text-red-300'
          }`}>
            {(formData.coding_accuracy_score * 100).toFixed(0)}%
          </div>
        </div>
        <p className="text-xs mt-1.5 text-white/40">Changes when you select different Procedure or Diagnosis codes</p>
      </div>

      {/* Submission Delay */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.claim_submission_delay_days}</span>
          Submission Delay (days)
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.claim_submission_delay_days}</p>
        <input
          type="number"
          name="claim_submission_delay_days"
          value={formData.claim_submission_delay_days}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          min="0"
          max="365"
          required
        />
      </div>

      {/* Payer */}
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2 hover:text-cyan-300 transition-colors">
          <span className="text-xl">{FIELD_ICONS.payer}</span>
          Payer
        </label>
        <p className="text-xs text-white/60 mb-2">{FIELD_DESCRIPTIONS.payer}</p>
        <select
          name="payer"
          value={formData.payer}
          onChange={handleChange}
          className="w-full px-4 py-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/20 transition-all duration-300 hover:border-white/30"
          required
        >
          {CATEGORICAL_OPTIONS.payer.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-6 border-t border-white/10">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-cyan-500/50 disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              Predict
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-white font-bold rounded-lg hover:from-slate-600 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-slate-500/30 disabled:hover:scale-100 border border-white/20"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🔄</span>
            Reset
          </span>
        </button>
      </div>
    </form>
  );
};

export default ClaimForm;
