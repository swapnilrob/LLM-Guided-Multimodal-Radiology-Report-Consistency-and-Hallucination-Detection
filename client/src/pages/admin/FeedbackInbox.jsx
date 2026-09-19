import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getFeedback } from '../../api/adminApi';

function VerdictBadge({ verdict }) {
  return verdict === 'thumbs_up'
    ? <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded uppercase bg-green-100 text-green-700"><ThumbsUp className="w-3 h-3" /> Approved</span>
    : <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded uppercase bg-red-100 text-red-700"><ThumbsDown className="w-3 h-3" /> Disputed</span>;
}

export default function FeedbackInbox() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter]     = useState('all');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await getFeedback();
      setFeedback(res.data.data ?? []);
      setError('');
    } catch {
      setError('Could not load feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const filtered = feedback.filter((f) => filter === 'all' || f.verdict === filter);

  const thumbsUp   = feedback.filter((f) => f.verdict === 'thumbs_up').length;
  const thumbsDown = feedback.filter((f) => f.verdict === 'thumbs_down').length;

  return (
    <div className="space-y-3">
      <div className="bg-chrome-section px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">F38 — AI Verdict Feedback Inbox</span>
        <button onClick={fetchFeedback} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-white text-chrome-section px-3 py-1 hover:bg-row-hover transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-panel border border-border-light p-4" style={{ borderTop: '3px solid #388E3C' }}>
          <div className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Total Feedback</div>
          <div className="text-2xl font-bold text-text-dark">{feedback.length}</div>
        </div>
        <div className="bg-panel border border-border-light p-4" style={{ borderTop: '3px solid #388E3C' }}>
          <div className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">{thumbsUp}</div>
        </div>
        <div className="bg-panel border border-border-light p-4" style={{ borderTop: '3px solid #D32F2F' }}>
          <div className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Disputed</div>
          <div className="text-2xl font-bold text-red-600">{thumbsDown}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-panel border border-border-light p-3 flex gap-3">
        {['all', 'thumbs_up', 'thumbs_down'].map((v) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-colors
                        ${filter === v ? 'bg-chrome-section text-white border-chrome-section' : 'bg-panel text-text-medium border-border-light hover:bg-row-hover'}`}>
            {v === 'all' ? 'All' : v === 'thumbs_up' ? 'Approved' : 'Disputed'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-panel border border-border-light p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-text-dark">{error}</span>
        </div>
      )}

      <div className="bg-panel border border-border-light">
        {loading ? (
          <div className="p-8 text-center text-text-medium text-sm">Loading feedback...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-sm">No feedback entries found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-input">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Verdict</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Correction</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <>
                  <tr key={f._id} className={`border-b border-border-light hover:bg-row-hover ${i % 2 === 0 ? 'bg-panel' : 'bg-input/40'}`}>
                    <td className="px-4 py-3"><VerdictBadge verdict={f.verdict} /></td>
                    <td className="px-4 py-3 text-text-dark font-medium">{f.user?.fullName ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-text-medium text-xs">{f.createdAt ? new Date(f.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      {f.correctionText && (
                        <button onClick={() => setExpanded(expanded === f._id ? null : f._id)}
                          className="flex items-center gap-1 text-xs text-accent-teal hover:text-chrome-section">
                          {expanded === f._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {expanded === f._id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === f._id && (
                    <tr key={`${f._id}-detail`} className="border-b border-border-light">
                      <td colSpan={4} className="px-4 py-3 bg-input border-l-4 border-accent-teal">
                        <p className="text-sm text-text-dark">{f.correctionText}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

