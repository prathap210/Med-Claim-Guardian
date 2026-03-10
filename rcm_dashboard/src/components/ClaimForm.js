import React, { useState } from 'react';

const CATEGORICAL_OPTIONS = {
  insurance_type: ['Private', 'Medicaid', 'Medicare'],
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

  const FormField = ({ name, label, type = 'text', options, description, icon, isReadOnly = false, isDropdown = false }) => (
    <div className="group">
      <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-2 hover:text-blue-700 transition-colors">
        <span className="text-lg">{icon}</span>
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <p className="text-xs text-gray-600 mb-2.5">{description}</p>
      {isDropdown ? (
        <select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
          required
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-white text-blue-900">
              {typeof opt === 'string' ? (opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : opt) : opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className={`w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-blue-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 ${isReadOnly ? 'cursor-not-allowed bg-gray-50' : ''}`}
          {...(type === 'number' && name === 'patient_age' ? { min: '1', max: '120' } : {})}
          {...(type === 'number' && name === 'claim_amount' ? { min: '0', step: '0.01' } : {})}
          {...(type === 'number' && name === 'claim_submission_delay_days' ? { min: '0', max: '365' } : {})}
          required={!isReadOnly}
          disabled={isReadOnly}
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. PATIENT & INSURANCE INFORMATION */}
      <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-700">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          <span>👤</span> Patient & Insurance Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField
            name="patient_age"
            label="Patient Age"
            type="number"
            description={FIELD_DESCRIPTIONS.patient_age}
            icon={FIELD_ICONS.patient_age}
          />
          <FormField
            name="insurance_type"
            label="Insurance Type"
            options={CATEGORICAL_OPTIONS.insurance_type}
            description={FIELD_DESCRIPTIONS.insurance_type}
            icon={FIELD_ICONS.insurance_type}
            isDropdown={true}
          />
          <FormField
            name="payer"
            label="Insurance Payer"
            options={CATEGORICAL_OPTIONS.payer}
            description={FIELD_DESCRIPTIONS.payer}
            icon={FIELD_ICONS.payer}
            isDropdown={true}
          />
        </div>
      </div>

      {/* 2. CLINICAL & CODING INFORMATION */}
      <div className="bg-teal-50 p-6 rounded-xl border-l-4 border-teal-700">
        <h3 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">
          <span>🔬</span> Clinical & Coding Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField
            name="procedure_code"
            label="Procedure Code"
            options={CATEGORICAL_OPTIONS.procedure_code}
            description={FIELD_DESCRIPTIONS.procedure_code}
            icon={FIELD_ICONS.procedure_code}
            isDropdown={true}
          />
          <FormField
            name="diagnosis_code"
            label="Diagnosis Code"
            options={CATEGORICAL_OPTIONS.diagnosis_code}
            description={FIELD_DESCRIPTIONS.diagnosis_code}
            icon={FIELD_ICONS.diagnosis_code}
            isDropdown={true}
          />
          <div className="group md:col-span-1 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-teal-900 mb-2">
              <span className="text-lg">{FIELD_ICONS.coding_accuracy_score}</span>
              Coding Accuracy
              <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-teal-200 text-teal-800 border border-teal-300">Auto</span>
            </label>
            <p className="text-xs text-gray-600 mb-2.5">Procedure–diagnosis compatibility</p>
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-teal-200 rounded-lg">
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(formData.coding_accuracy_score * 100).toFixed(0)}%`,
                    background: formData.coding_accuracy_score >= 0.85
                      ? 'linear-gradient(to right, #059669, #10b981)'
                      : formData.coding_accuracy_score >= 0.60
                      ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                      : 'linear-gradient(to right, #ef4444, #f87171)',
                  }}
                />
              </div>
              <div className={`px-3 py-1.5 rounded font-bold text-xs w-14 text-center border ${
                formData.coding_accuracy_score >= 0.85
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : formData.coding_accuracy_score >= 0.60
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-red-100 border-red-300 text-red-800'
              }`}>
                {(formData.coding_accuracy_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROVIDER & CLAIM INFORMATION */}
      <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-700">
        <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
          <span>🏥</span> Provider & Claim Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormField
            name="provider_type"
            label="Provider Type"
            options={CATEGORICAL_OPTIONS.provider_type}
            description={FIELD_DESCRIPTIONS.provider_type}
            icon={FIELD_ICONS.provider_type}
            isDropdown={true}
          />
          <FormField
            name="claim_amount"
            label="Claim Amount (₹)"
            type="number"
            description={FIELD_DESCRIPTIONS.claim_amount}
            icon={FIELD_ICONS.claim_amount}
          />
          <FormField
            name="claim_submission_delay_days"
            label="Submission Delay (days)"
            type="number"
            description={FIELD_DESCRIPTIONS.claim_submission_delay_days}
            icon={FIELD_ICONS.claim_submission_delay_days}
          />
        </div>
      </div>

      {/* 4. DOCUMENTATION & AUTHORIZATION */}
      <div className="bg-orange-50 p-6 rounded-xl border-l-4 border-orange-700">
        <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          <span>📋</span> Documentation & Authorization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            name="documentation_complete"
            label="Documentation Complete"
            options={CATEGORICAL_OPTIONS.documentation_complete}
            description={FIELD_DESCRIPTIONS.documentation_complete}
            icon={FIELD_ICONS.documentation_complete}
            isDropdown={true}
          />
          <FormField
            name="prior_authorization"
            label="Prior Authorization"
            options={CATEGORICAL_OPTIONS.prior_authorization}
            description={FIELD_DESCRIPTIONS.prior_authorization}
            icon={FIELD_ICONS.prior_authorization}
            isDropdown={true}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-300">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/40 disabled:hover:scale-100 text-base"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              Predict Claim
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={resetForm}
          disabled={isLoading}
          className="flex-1 px-6 py-3.5 bg-gray-200 text-gray-800 font-bold border border-gray-300 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-gray-400/40 disabled:hover:scale-100 text-base"
        >
          <span className="flex items-center justify-center gap-2">
            <span>🔄</span>
            Reset Form
          </span>
        </button>
      </div>
    </form>
  );
};

export default ClaimForm;
