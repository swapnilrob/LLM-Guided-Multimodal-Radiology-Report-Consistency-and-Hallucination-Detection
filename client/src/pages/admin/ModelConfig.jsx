import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { getModelConfig, updateModelConfig } from '../../api/adminApi';

const MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.2-11b-vision-instruct:free',
];

export default function ModelConfig() {
  const [config, setConfig] = useState({
    aiModel:             'google/gemma-4-31b-it:free',
    openrouterApiKey:    '',
    temperature:         0.3,
    confidenceThreshold: 0.5,
    claimExtractionEnabled:        true,
    hallucinationDetectionEnabled: true,
    consistencyCheckEnabled:       true,
    correctionEnabled:             true,
  });

  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);

  const showMsg = (text, error = false) => {
    setMsg(text);
    setIsError(error);
    setTimeout(() => setMsg(''), 4000);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getModelConfig();
        if (res.data.data) setConfig((prev) => ({ ...prev, ...res.data.data }));
      } catch {
        // Config not saved yet, use defaults
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateModelConfig(config);
      showMsg('Configuration saved successfully.');
    } catch {
      showMsg('Failed to save configuration.', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-panel border border-border-light p-8 text-center text-text-medium text-sm">
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-chrome-section px-4 py-2">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F34 — Model Configuration Panel
        </span>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 px-4 py-2 border text-sm ${isError ? 'bg-panel border-red-500 text-red-600' : 'bg-row-selected border-accent-teal text-text-dark'}`}>
          {isError ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {msg}
        </div>
      )}

      <div className="bg-panel border border-border-light p-5 space-y-5">

        <div>
          <div className="bg-chrome-section px-3 py-1.5 mb-3">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">LLM Model Selection</span>
          </div>
          <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Active Model</label>
          <select
            value={config.aiModel}
            onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
            className="w-full max-w-lg px-3 py-2 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus"
          >
            {MODELS.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>

        <div>
          <div className="bg-chrome-section px-3 py-1.5 mb-3">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">API Credentials</span>
          </div>
          <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">OpenRouter API Key</label>
          <div className="relative max-w-lg">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.openrouterApiKey}
              onChange={(e) => setConfig({ ...config, openrouterApiKey: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full px-3 py-2 pr-10 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus font-mono"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <div className="bg-chrome-section px-3 py-1.5 mb-3">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">Inference Parameters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Temperature: {config.temperature}</label>
              <input type="range" min="0" max="1" step="0.05" value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full" />
              <div className="flex justify-between text-xs text-text-light mt-1"><span>0 (precise)</span><span>1 (creative)</span></div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Confidence Threshold: {config.confidenceThreshold}</label>
              <input type="range" min="0" max="1" step="0.05" value={config.confidenceThreshold}
                onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                className="w-full" />
              <div className="flex justify-between text-xs text-text-light mt-1"><span>0 (lenient)</span><span>1 (strict)</span></div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-chrome-section px-3 py-1.5 mb-3">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">Pipeline Module Toggles</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'claimExtractionEnabled',        label: 'Claim Extraction' },
              { key: 'hallucinationDetectionEnabled',  label: 'Hallucination Detection' },
              { key: 'consistencyCheckEnabled',        label: 'Consistency Check' },
              { key: 'correctionEnabled',              label: 'Report Correction' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setConfig({ ...config, [key]: !config[key] })}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${config[key] ? 'bg-accent-teal' : 'bg-border-light'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-text-dark">{label}</span>
                <span className={`text-xs font-semibold uppercase ${config[key] ? 'text-green-600' : 'text-text-light'}`}>{config[key] ? 'ON' : 'OFF'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border-light">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-semibold uppercase tracking-wide bg-chrome-section text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
