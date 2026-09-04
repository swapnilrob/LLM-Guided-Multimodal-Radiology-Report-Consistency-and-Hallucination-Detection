import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Trash2,
  Loader2,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalyses, deleteAnalysis } from '../api/analysisApi';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';

const PAGE_SIZE = 8;

export default function HistoryPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

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
        setError('Failed to load analysis history.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAnalyses();
  }, [token, logout]);

  const filteredAnalyses = useMemo(() => {
    if (!searchQuery.trim()) return analyses;
    const query = searchQuery.toLowerCase();
    return analyses.filter((a) => {
      const reportText = (a.reportText || a.report || '').toLowerCase();
      const status = (a.status || '').toLowerCase();
      return reportText.includes(query) || status.includes(query);
    });
  }, [analyses, searchQuery]);

  const sortedAnalyses = useMemo(() => {
    const sorted = [...filteredAnalyses].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'createdAt':
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        case 'reliabilityScore':
          aVal = a.reliabilityScore ?? -1;
          bVal = b.reliabilityScore ?? -1;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'claims':
          aVal = (a.claims || []).length;
          bVal = (b.claims || []).length;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAnalyses, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedAnalyses.length / PAGE_SIZE);
  const paginatedAnalyses = sortedAnalyses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-text-light" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3 text-accent-teal" />;
    return <ArrowDown className="w-3 h-3 text-accent-teal" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getReportPreview = (analysis) => {
    const text = analysis.reportText || analysis.report || '';
    if (!text) return 'No report text';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  const getRowStatus = (analysis) => {
    if (analysis.status === 'failed') return 'mismatch';
    if (analysis.status !== 'complete') return 'uncertain';
    if (analysis.reliabilityScore <= 35) return 'hallucinated';
    if (analysis.reliabilityScore <= 65) return 'mismatch';
    return 'verified';
  };

  const getHallucinationCount = (analysis) => {
    if (!analysis.claims) return 0;
    return analysis.claims.filter((c) => c.verdict === 'hallucinated').length;
  };

  const handleDelete = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis? This cannot be undone.')) {
      return;
    }
    try {
      await deleteAnalysis(token, analysisId);
      setAnalyses((prev) => prev.filter((a) => a._id !== analysisId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete analysis. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-dark">Analysis History</h1>
            <p className="text-sm text-text-medium mt-0.5">
              {analyses.length} total {analyses.length === 1 ? 'analysis' : 'analyses'}
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 bg-chrome-section text-white px-4 py-2.5 rounded font-semibold text-sm uppercase tracking-wider hover:bg-chrome-section-alt transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by report text or status..."
            className="w-full bg-panel border border-border-light rounded pl-10 pr-4 py-2.5 text-sm text-text-dark placeholder:text-text-light focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors"
          />
        </div>

        <div className="bg-panel rounded border border-border-light overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-accent-teal animate-spin" />
              <span className="ml-2 text-sm text-text-medium">Loading history...</span>
            </div>
          )}

          {!loading && analyses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-10 h-10 text-text-light mb-3" />
              <p className="text-sm font-medium text-text-dark">No analyses found</p>
              <p className="text-xs text-text-medium mt-1 mb-4">Upload a chest X-ray and report to get started</p>
              <button
                onClick={() => navigate('/upload')}
                className="flex items-center gap-2 bg-chrome-section text-white px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider hover:bg-chrome-section-alt transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          )}

          {!loading && analyses.length > 0 && filteredAnalyses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="w-8 h-8 text-text-light mb-3" />
              <p className="text-sm font-medium text-text-dark">No matching analyses</p>
              <p className="text-xs text-text-medium mt-1">Try a different search term</p>
            </div>
          )}

          {!loading && paginatedAnalyses.length > 0 && (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-light bg-input-bg">
                    <th className="text-left px-4 py-2.5">
                      <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 text-xs font-semibold text-text-medium hover:text-text-dark transition-colors">
                        Date <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-2.5"><span className="text-xs font-semibold text-text-medium">Report</span></th>
                    <th className="text-left px-4 py-2.5">
                      <button onClick={() => handleSort('reliabilityScore')} className="flex items-center gap-1 text-xs font-semibold text-text-medium hover:text-text-dark transition-colors">
                        Score <SortIcon field="reliabilityScore" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-2.5">
                      <button onClick={() => handleSort('claims')} className="flex items-center gap-1 text-xs font-semibold text-text-medium hover:text-text-dark transition-colors">
                        Hallucinations <SortIcon field="claims" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-2.5">
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-text-medium hover:text-text-dark transition-colors">
                        Status <SortIcon field="status" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-2.5"><span className="text-xs font-semibold text-text-medium">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAnalyses.map((analysis) => (
                    <tr
                      key={analysis._id}
                      onClick={() => { if (analysis.status === 'complete') navigate(`/results/${analysis._id}`); }}
                      className={`border-b border-border-light last:border-b-0 transition-colors ${analysis.status === 'complete' ? 'hover:bg-row-hover cursor-pointer' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm text-text-dark whitespace-nowrap">{formatDate(analysis.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-text-medium max-w-xs"><p className="truncate">{getReportPreview(analysis)}</p></td>
                      <td className="px-4 py-3">
                        {analysis.status === 'complete' ? (
                          <span className={`text-sm font-bold ${analysis.reliabilityScore <= 35 ? 'text-status-hallucinated' : analysis.reliabilityScore <= 65 ? 'text-status-mismatch' : 'text-status-verified'}`}>
                            {analysis.reliabilityScore}/100
                          </span>
                        ) : (<span className="text-sm text-text-light">—</span>)}
                      </td>
                      <td className="px-4 py-3">
                        {analysis.status === 'complete' ? (
                          <span className={`text-sm font-bold ${getHallucinationCount(analysis) > 0 ? 'text-status-hallucinated' : 'text-status-verified'}`}>
                            {getHallucinationCount(analysis)}
                          </span>
                        ) : (<span className="text-sm text-text-light">—</span>)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={getRowStatus(analysis)} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {analysis.status === 'complete' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/results/${analysis._id}`); }}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-input-bg">
                  <p className="text-xs text-text-medium">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedAnalyses.length)} of {sortedAnalyses.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded text-text-medium hover:text-text-dark hover:bg-row-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-medium transition-colors ${currentPage === page ? 'bg-chrome-section text-white' : 'text-text-medium hover:bg-row-hover'}`}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded text-text-medium hover:text-text-dark hover:bg-row-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 