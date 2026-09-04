import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Activity,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalyses, deleteAnalysis } from '../api/analysisApi';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import ReliabilityGauge from '../components/common/ReliabilityGauge';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const data = await getAnalyses(token);
        const list = data.analyses || data || [];
        setAnalyses(list);
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
        if (err.response?.status === 401) {
          logout();
          return;
        }
        setError('Failed to load analyses. Make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalyses();
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  const totalAnalyses = analyses.length;
  const completedAnalyses = analyses.filter((a) => a.status === 'complete');

  const averageScore =
    completedAnalyses.length > 0
      ? Math.round(
          completedAnalyses.reduce((sum, a) => sum + (a.reliabilityScore || 0), 0) /
            completedAnalyses.length
        )
      : 0;

  const totalHallucinations = completedAnalyses.reduce((sum, a) => {
    if (!a.claims) return sum;
    return sum + a.claims.filter((c) => c.verdict === 'hallucinated').length;
  }, 0);

  const pendingAnalyses = analyses.filter(
    (a) => a.status !== 'complete' && a.status !== 'failed'
  ).length;

  const recentAnalyses = [...analyses]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReportPreview = (analysis) => {
    const text = analysis.reportText || analysis.report || '';
    if (!text) return 'No report text';
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  };

  const getRowStatus = (analysis) => {
    if (analysis.status === 'failed') return 'mismatch';
    if (analysis.status !== 'complete') return 'uncertain';
    if (analysis.reliabilityScore <= 35) return 'hallucinated';
    if (analysis.reliabilityScore <= 65) return 'mismatch';
    return 'verified';
  };

  const handleDelete = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return;
    try {
      await deleteAnalysis(token, analysisId);
      setAnalyses((prev) => prev.filter((a) => a._id !== analysisId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-dark">Dashboard</h1>
            <p className="text-sm text-text-medium mt-0.5">
              Welcome back{user?.fullName ? `, ${user.fullName}` : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 bg-chrome-section text-white px-4 py-2.5 rounded font-semibold text-sm uppercase tracking-wider
                       hover:bg-chrome-section-alt transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-accent-teal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Total Analyses</span>
              <FileText className="w-4 h-4 text-accent-teal" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalAnalyses}</p>
            <p className="text-xs text-text-light mt-1">All time</p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-accent-teal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Average Score</span>
              <Activity className="w-4 h-4 text-accent-teal" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{averageScore}<span className="text-sm font-normal text-text-light"> / 100</span></p>
            <p className="text-xs text-text-light mt-1">Across completed analyses</p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-status-hallucinated">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Hallucinations</span>
              <AlertTriangle className="w-4 h-4 text-status-hallucinated" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalHallucinations}</p>
            <p className="text-xs text-text-light mt-1">Total claims flagged</p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-status-uncertain">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Pending</span>
              <Clock className="w-4 h-4 text-status-uncertain" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{pendingAnalyses}</p>
            <p className="text-xs text-text-light mt-1">In progress</p>
          </div>
        </div>

        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-dark">Recent Analyses</h2>
            {analyses.length > 5 && (
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-accent-teal font-medium hover:underline"
              >
                View All
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-accent-teal animate-spin" />
              <span className="ml-2 text-sm text-text-medium">Loading analyses...</span>
            </div>
          )}

          {!loading && analyses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-10 h-10 text-text-light mb-3" />
              <p className="text-sm font-medium text-text-dark">No analyses yet</p>
              <p className="text-xs text-text-medium mt-1 mb-4">
                Upload a chest X-ray and report to get started
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 bg-chrome-section text-white px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider
                           hover:bg-chrome-section-alt transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          )}

          {!loading && analyses.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="text-left text-xs font-semibold text-text-medium px-4 py-2.5">Date</th>
                  <th className="text-left text-xs font-semibold text-text-medium px-4 py-2.5">Report</th>
                  <th className="text-left text-xs font-semibold text-text-medium px-4 py-2.5">Score</th>
                  <th className="text-left text-xs font-semibold text-text-medium px-4 py-2.5">Status</th>
                  <th className="text-right text-xs font-semibold text-text-medium px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentAnalyses.map((analysis) => (
                  <tr
                    key={analysis._id}
                    className="border-b border-border-light last:border-b-0 hover:bg-row-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-text-dark whitespace-nowrap">
                      {formatDate(analysis.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-medium max-w-xs truncate">
                      {getReportPreview(analysis)}
                    </td>
                    <td className="px-4 py-3">
                      {analysis.status === 'complete' ? (
                        <span
                          className={`text-sm font-bold ${
                            analysis.reliabilityScore <= 35
                              ? 'text-status-hallucinated'
                              : analysis.reliabilityScore <= 65
                              ? 'text-status-mismatch'
                              : 'text-status-verified'
                          }`}
                        >
                          {analysis.reliabilityScore}
                        </span>
                      ) : (
                        <span className="text-sm text-text-light">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getRowStatus(analysis)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {analysis.status === 'complete' && (
                          <button
                            onClick={() => navigate(`/results/${analysis._id}`)}
                            className="p-1.5 text-text-medium hover:text-accent-teal transition-colors"
                            title="View results"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(analysis._id, e)}
                          className="p-1.5 text-text-medium hover:text-status-hallucinated transition-colors"
                          title="Delete analysis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
} 