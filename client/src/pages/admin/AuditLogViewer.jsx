import { useState, useEffect } from 'react';
import { Search, Download, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAuditLogs } from '../../api/adminApi';

const ACTION_TYPES = [
  'all', 'login', 'logout', 'register', 'upload', 'analysis_complete',
  'role_change', 'user_deleted', 'user_suspended', 'password_change',
];

function ActionBadge({ action }) {
  const color = {
    login:              'bg-status-verified text-white',
    logout:             'bg-border-light text-text-medium',
    register:           'bg-accent-teal text-white',
    upload:             'bg-status-uncertain text-text-dark',
    analysis_complete:  'bg-status-verified text-white',
    role_change:        'bg-status-mismatch text-white',
    user_deleted:       'bg-status-hallucinated text-white',
    user_suspended:     'bg-status-hallucinated text-white',
  }[action] ?? 'bg-border-light text-text-medium';

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${color}`}>
      {action?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AuditLogViewer() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      if (search) params.search = search;
      const res = await getAuditLogs(params);
      setLogs(res.data.data ?? []);
      setError('');
    } catch {
      setError('Could not load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  // CSV export
  const exportCSV = () => {
    const header = 'Action,User,IP Address,Timestamp\n';
    const rows = logs.map((l) =>
      `${l.action},${l.userId?.fullName ?? 'Unknown'},${l.ipAddress ?? '—'},${new Date(l.createdAt).toLocaleString()}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = logs.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.userId?.fullName?.toLowerCase().includes(term) ||
      l.ipAddress?.includes(term)
    );
  });

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="bg-chrome-section px-4 py-2">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F35 — System Audit Log
        </span>
      </div>

      {/* Toolbar */}
      <div className="bg-panel border border-border-light p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
            <input
              type="text"
              placeholder="Search user or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border-light bg-input
                         text-text-dark focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm border border-border-light bg-input px-3 py-2
                       text-text-dark focus:outline-none focus:border-border-focus"
          >
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>{a === 'all' ? 'All actions' : a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase
                       border border-border-light text-text-medium hover:text-text-dark
                       hover:bg-row-hover transition-colors tracking-wide"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase
                       bg-chrome-dark text-white hover:bg-chrome-section transition-colors tracking-wide"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-panel border border-border-light p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-status-hallucinated" />
          <span className="text-sm text-text-dark">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-panel border border-border-light overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-text-medium text-sm">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-sm">No log entries found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-input">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">IP Address</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <>
                  <tr
                    key={log._id}
                    className={`border-b border-border-light transition-colors hover:bg-row-hover
                                ${i % 2 === 0 ? 'bg-panel' : 'bg-input/40'}`}
                  >
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3 text-text-dark font-medium">
                      {log.userId?.fullName ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-text-medium font-mono text-xs">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-text-medium text-xs">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.details && (
                        <button
                          onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                          className="flex items-center gap-1 text-xs text-accent-teal hover:text-chrome-section"
                        >
                          {expanded === log._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {expanded === log._id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === log._id && (
                    <tr key={`${log._id}-detail`} className="border-b border-border-light">
                      <td colSpan={5} className="px-4 py-3 bg-input border-l-4 border-accent-teal">
                        <pre className="text-xs text-text-dark whitespace-pre-wrap font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <div className="text-xs text-text-light px-1">
          Showing {filtered.length} of {logs.length} entries
        </div>
      )}
    </div>
  );
}
