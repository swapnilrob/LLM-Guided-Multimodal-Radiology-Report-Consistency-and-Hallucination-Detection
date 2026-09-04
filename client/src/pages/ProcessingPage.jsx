import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Shield,
  GitCompare,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalysisById } from '../api/analysisApi';
import Layout from '../components/layout/Layout';

// Pipeline steps in order — these match the backend status values
const PIPELINE_STEPS = [
  {
    key: 'uploading',
    label: 'Uploading Files',
    description: 'Uploading your chest X-ray and report to the server...',
    icon: FileText,
  },
  {
    key: 'extracting_claims',
    label: 'Extracting Claims',
    description: 'The LLM is decomposing the report into individual verifiable claims...',
    icon: Search,
  },
  {
    key: 'detecting_hallucinations',
    label: 'Detecting Hallucinations',
    description: 'Each claim is being verified against the X-ray image evidence...',
    icon: Shield,
  },
  {
    key: 'checking_consistency',
    label: 'Checking Consistency',
    description: 'Comparing Findings and Impression sections for contradictions...',
    icon: GitCompare,
  },
  {
    key: 'generating_correction',
    label: 'Generating Corrections',
    description: 'Creating a corrected version of the report and computing reliability score...',
    icon: ClipboardCheck,
  },
];

export default function ProcessingPage() {
  const { id } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('uploading');
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(true);

  // Determine which step index we're on
  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.key === status);

  // Poll the backend for status updates
  const checkStatus = useCallback(async () => {
    try {
      const data = await getAnalysisById(token, id);
      const analysis = data.analysis || data;
      const newStatus = analysis.status || 'uploading';

      setStatus(newStatus);

      // If complete, redirect to results after a short delay
      if (newStatus === 'complete') {
        setPolling(false);
        setTimeout(() => {
          navigate(`/results/${id}`, { replace: true });
        }, 1500);
      }

      // If failed, stop polling and show error
      if (newStatus === 'failed') {
        setPolling(false);
        setError(analysis.error || 'The analysis pipeline encountered an error.');
      }
    } catch (err) {
      console.error('Polling error:', err);
      if (err.response?.status === 401) {
        logout();
        return;
      }
      // Don't stop polling on network errors — keep trying
    }
  }, [token, id, navigate, logout]);

  // Start polling every 3 seconds
  useEffect(() => {
    if (!polling) return;

    // Check immediately
    checkStatus();

    // Then check every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [polling, checkStatus]);

  // Calculate progress percentage
  const getProgressPercent = () => {
    if (status === 'complete') return 100;
    if (status === 'failed') return currentStepIndex >= 0 ? ((currentStepIndex) / PIPELINE_STEPS.length) * 100 : 0;
    if (currentStepIndex < 0) return 0;
    return ((currentStepIndex + 0.5) / PIPELINE_STEPS.length) * 100;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-8 space-y-6">
        {/* ── Header ── */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-text-dark">
            {status === 'complete'
              ? 'Analysis Complete!'
              : status === 'failed'
              ? 'Analysis Failed'
              : 'Analyzing Your Report...'}
          </h1>
          <p className="text-sm text-text-medium mt-1">
            {status === 'complete'
              ? 'Redirecting to your results...'
              : status === 'failed'
              ? 'Something went wrong during processing.'
              : 'This may take a few minutes due to AI model processing.'}
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div className="bg-panel rounded border border-border-light p-6">
          {/* Bar track */}
          <div className="w-full h-2 bg-input-bg rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                status === 'failed'
                  ? 'bg-status-hallucinated'
                  : status === 'complete'
                  ? 'bg-status-verified'
                  : 'bg-accent-teal'
              }`}
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              let stepState = 'pending'; // pending, active, complete, failed

              if (status === 'complete') {
                stepState = 'complete';
              } else if (status === 'failed' && index <= currentStepIndex) {
                stepState = index === currentStepIndex ? 'failed' : 'complete';
              } else if (index < currentStepIndex) {
                stepState = 'complete';
              } else if (index === currentStepIndex) {
                stepState = 'active';
              }

              return (
                <div
                  key={step.key}
                  className={`flex items-start gap-3 p-3 rounded transition-colors ${
                    stepState === 'active' ? 'bg-row-selected' :
                    stepState === 'failed' ? 'bg-red-50' : ''
                  }`}
                >
                  {/* Step icon / status */}
                  <div className="mt-0.5 shrink-0">
                    {stepState === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-status-verified" />
                    ) : stepState === 'active' ? (
                      <Loader2 className="w-5 h-5 text-accent-teal animate-spin" />
                    ) : stepState === 'failed' ? (
                      <XCircle className="w-5 h-5 text-status-hallucinated" />
                    ) : (
                      <StepIcon className="w-5 h-5 text-text-light" />
                    )}
                  </div>

                  {/* Step text */}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        stepState === 'complete' ? 'text-status-verified' :
                        stepState === 'active' ? 'text-text-dark' :
                        stepState === 'failed' ? 'text-status-hallucinated' :
                        'text-text-light'
                      }`}
                    >
                      {step.label}
                    </p>
                    {(stepState === 'active' || stepState === 'failed') && (
                      <p className="text-xs text-text-medium mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Error message ── */}
        {status === 'failed' && (
          <div className="bg-panel rounded border border-border-light p-4">
            <div className="flex items-start gap-2 text-sm text-status-hallucinated mb-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error || 'The analysis pipeline encountered an error.'}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-chrome-section text-white text-sm font-semibold uppercase tracking-wider rounded
                           hover:bg-chrome-section-alt transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-border-light text-text-medium text-sm font-semibold uppercase tracking-wider rounded
                           hover:border-accent-teal hover:text-text-dark transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* ── Tip while waiting ── */}
        {status !== 'complete' && status !== 'failed' && (
          <div className="text-center">
            <p className="text-xs text-text-light">
              The AI model processes each claim individually against the image.
              This typically takes 2–5 minutes depending on the report length.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
} 