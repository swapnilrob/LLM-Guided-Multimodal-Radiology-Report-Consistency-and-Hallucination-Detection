import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, Share2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getSharedAnalysis } from '../api/collaborationApi';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';
import ReliabilityGauge from '../components/common/ReliabilityGauge';
import StatusBadge from '../components/common/StatusBadge';
import ClaimRow from '../components/results/ClaimRow';
import ReportComparison from '../components/results/ReportComparison';
import ImageViewer from '../components/results/ImageViewer';

export default function SharedResultsPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [sharedBy, setSharedBy] = useState(null);
  const [accessLevel, setAccessLevel] = useState('view');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const data = await getSharedAnalysis(token);
        setAnalysis(data.analysis);
        setSharedBy(data.sharedBy);
        setAccessLevel(data.accessLevel);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to access this shared analysis');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-teal animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-medium">Loading shared analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-status-hallucinated mx-auto mb-3" />
          <p className="text-sm font-medium text-text-dark">{error || 'Something went wrong'}</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-sm text-accent-teal hover:underline">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const claims = analysis.claims || [];
  const consistencyViolations = analysis.consistencyViolations || [];
  const reportText = analysis.originalReportText || '';
  const correctedReport = analysis.correctedReportText || '';
  const reliabilityScore = analysis.reliabilityScore ?? 0;
  const imageUrl = analysis.imageUrl || '';

  const supportedCount = claims.filter((c) => c.verdict === 'supported').length;
  const hallucinatedCount = claims.filter((c) => c.verdict === 'hallucinated').length;
  const uncertainCount = claims.filter((c) => c.verdict === 'uncertain').length;

  return (
    <div className="min-h-screen bg-page">
      <div className="bg-chrome-dark text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-accent-teal-light" />
          <div>
            <h1 className="text-sm font-bold">Shared Analysis</h1>
            <p className="text-xs text-white/60">
              Shared by {sharedBy?.fullName || 'Unknown'} · {accessLevel === 'comment' ? 'View & Comment' : 'View Only'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Panel 1 */}
          <div className="lg:col-span-3 space-y-3">
            <div className="bg-panel rounded border border-border-light overflow-hidden">
              <SectionHeader number="1" title="INPUT & ANALYSIS" />
              <div className="p-3 space-y-4">
                <ImageViewer imageUrl={imageUrl} claims={claims} selectedClaim={selectedClaim} onClaimSelect={setSelectedClaim} />
                <div>
                  <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1.5">AI Generated Report</p>
                  <div className="bg-input-bg border border-border-light rounded-sm p-2.5 text-xs text-text-dark leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {reportText || 'No report text.'}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-dark uppercase tracking-wide mb-2 pt-2 border-t border-border-light">Analysis Summary</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium">Claims Extracted</span>
                      <span className="font-bold text-text-dark">{claims.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-status-verified" />Supported</span>
                      <span className="font-bold text-status-verified">{supportedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1"><XCircle className="w-3 h-3 text-status-hallucinated" />Hallucinated</span>
                      <span className="font-bold text-status-hallucinated">{hallucinatedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-status-uncertain" />Uncertain</span>
                      <span className="font-bold text-status-uncertain">{uncertainCount}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border-light">
                  <ReliabilityGauge score={reliabilityScore} />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2 */}
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
                    <ClaimRow key={claim._id || index} claim={claim} index={index} isSelected={selectedClaim === index} onSelect={setSelectedClaim} />
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
                  {consistencyViolations.map((v, i) => (
                    <div key={i} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Findings</p>
                          <div className="bg-red-50 border border-red-200 rounded-sm p-2.5 text-sm text-text-dark">{v.findingsSentence || 'N/A'}</div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Impression</p>
                          <div className="bg-orange-50 border border-orange-200 rounded-sm p-2.5 text-sm text-text-dark">{v.impressionSentence || 'N/A'}</div>
                        </div>
                      </div>
                      {v.explanation && <p className="mt-2 text-xs text-text-medium">{v.explanation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel 3 */}
          <div className="lg:col-span-3">
            <div className="bg-panel rounded border border-border-light overflow-hidden">
              <SectionHeader number="3" title="INTERACTIVE CORRECTION & DECISION" />
              <div className="p-3">
                <ReportComparison originalReport={reportText} correctedReport={correctedReport} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}