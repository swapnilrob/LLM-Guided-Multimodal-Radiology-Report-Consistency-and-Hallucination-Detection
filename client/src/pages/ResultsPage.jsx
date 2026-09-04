import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalysisById } from '../api/analysisApi';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';
import ReliabilityGauge from '../components/common/ReliabilityGauge';
import StatusBadge from '../components/common/StatusBadge';
import ClaimRow from '../components/results/ClaimRow';
import ReportComparison from '../components/results/ReportComparison';
import ImageViewer from '../components/results/ImageViewer';

export default function ResultsPage() {
  const { id } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await getAnalysisById(token, id);
        setAnalysis(data.analysis || data);
      } catch (err) {
        console.error('Failed to fetch analysis:', err);
        if (err.response?.status === 401) {
          logout();
          return;
        }
        if (err.response?.status === 404) {
          setError('Analysis not found.');
        } else {
          setError('Failed to load analysis. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchAnalysis();
    }
  }, [token, id, logout]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-accent-teal animate-spin mb-3" />
          <p className="text-sm text-text-medium">Loading analysis results...</p>
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-8 h-8 text-status-hallucinated mb-3" />
          <p className="text-sm font-medium text-text-dark">
            {error || 'Something went wrong'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-accent-teal hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const claims = analysis.claims || [];
  const consistencyViolations = analysis.consistencyViolations || [];
  const reportText = analysis.reportText || analysis.report || '';
  const correctedReport = analysis.correctedReport || '';
  const reliabilityScore = analysis.reliabilityScore ?? 0;
  const imageUrl = analysis.imageUrl || analysis.image?.url || '';

  const supportedCount = claims.filter((c) => c.verdict === 'supported').length;
  const hallucinatedCount = claims.filter((c) => c.verdict === 'hallucinated').length;
  const uncertainCount = claims.filter((c) => c.verdict === 'uncertain').length;

  return (
    <Layout>
      <div className="space-y-3">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 text-text-medium hover:text-text-dark transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-dark">Analysis Results</h1>
              <p className="text-xs text-text-medium">
                {analysis.createdAt
                  ? new Date(analysis.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-light rounded text-xs font-medium text-text-medium hover:text-text-dark hover:border-accent-teal transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-light rounded text-xs font-medium text-text-medium hover:text-text-dark hover:border-accent-teal transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* ── Three-Panel Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

          {/* ══ PANEL 1 — INPUT & ANALYSIS ══ */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-panel rounded border border-border-light overflow-hidden">
              <SectionHeader number="1" title="INPUT & ANALYSIS" />

              <div className="p-3 space-y-4">
                {/* X-ray image with bounding box overlays */}
                <ImageViewer
                  imageUrl={imageUrl}
                  claims={claims}
                  selectedClaim={selectedClaim}
                  onClaimSelect={setSelectedClaim}
                />

                {/* Report text */}
                <div>
                  <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1.5">
                    AI Generated Report
                  </p>
                  <div className="bg-input-bg border border-border-light rounded-sm p-2.5 text-xs text-text-dark leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {reportText || 'No report text.'}
                  </div>
                </div>

                {/* Analysis summary */}
                <div>
                  <p className="text-xs font-semibold text-text-dark uppercase tracking-wide mb-2 pt-2 border-t border-border-light">
                    Analysis Summary
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium">Claims Extracted</span>
                      <span className="font-bold text-text-dark">{claims.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-status-verified" />
                        Supported
                      </span>
                      <span className="font-bold text-status-verified">{supportedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-status-hallucinated" />
                        Hallucinated
                      </span>
                      <span className="font-bold text-status-hallucinated">{hallucinatedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-status-uncertain" />
                        Uncertain
                      </span>
                      <span className="font-bold text-status-uncertain">{uncertainCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border-light">
                      <span className="text-text-medium">Consistency Violations</span>
                      <span className={`font-bold ${consistencyViolations.length > 0 ? 'text-status-mismatch' : 'text-status-verified'}`}>
                        {consistencyViolations.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reliability gauge */}
                <div className="pt-2 border-t border-border-light">
                  <ReliabilityGauge score={reliabilityScore} />
                </div>
              </div>
            </div>
          </div>

          {/* ══ PANEL 2 — CLAIM VERIFICATION ══ */}
          <div className="lg:col-span-6 space-y-3">
            <div className="bg-panel rounded border border-border-light overflow-hidden">
              <SectionHeader number="2" title="MULTIMODAL CLAIM VERIFICATION" />

              <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light bg-input-bg">
                <div className="w-4" />
                <span className="font-mono text-xs text-text-medium w-10">ID</span>
                <span className="flex-1 text-xs font-semibold text-text-medium">Claim</span>
                <span className="text-xs font-semibold text-text-medium w-12 text-right">Risk</span>
                <span className="text-xs font-semibold text-text-medium w-48 text-right">Status</span>
              </div>

              {claims.length > 0 ? (
                <div>
                  {claims.map((claim, index) => (
                    <ClaimRow
                      key={index}
                      claim={claim}
                      index={index}
                      isSelected={selectedClaim === index}
                      onSelect={setSelectedClaim}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-text-light">No claims extracted.</p>
                </div>
              )}
            </div>

            {consistencyViolations.length > 0 && (
              <div className="bg-panel rounded border border-border-light overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border-light flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-dark">Consistency Violations</h3>
                  <StatusBadge status="mismatch" count={consistencyViolations.length} />
                </div>

                <div className="divide-y divide-border-light">
                  {consistencyViolations.map((violation, index) => (
                    <div key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Findings Section</p>
                          <div className="bg-red-50 border border-red-200 rounded-sm p-2.5 text-sm text-text-dark">
                            {violation.findingsText || violation.findings || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Impression Section</p>
                          <div className="bg-orange-50 border border-orange-200 rounded-sm p-2.5 text-sm text-text-dark">
                            {violation.impressionText || violation.impression || 'N/A'}
                          </div>
                        </div>
                      </div>
                      {violation.explanation && (
                        <p className="mt-2 text-xs text-text-medium leading-relaxed">{violation.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══ PANEL 3 — CORRECTION & DECISION ══ */}
          <div className="lg:col-span-3">
            <div className="bg-panel rounded border border-border-light overflow-hidden">
              <SectionHeader number="3" title="INTERACTIVE CORRECTION & DECISION" />
              <div className="p-3">
                <ReportComparison
                  originalReport={reportText}
                  correctedReport={correctedReport}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}  