import { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { getAllUsers, updateUserQuota } from '../../api/adminApi';

const QUOTA_LIMIT_MB = 500;

function QuotaBar({ used, limit }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500';
  return (
    <div className="w-full bg-border-light rounded-full h-2">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function QuotaManagement() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [msg, setMsg]         = useState('');
  const [editing, setEditing] = useState({});

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data.data ?? []);
      setError('');
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleQuotaSave = async (userId) => {
    const newQuota = editing[userId];
    if (!newQuota) return;
    try {
      await updateUserQuota(userId, parseInt(newQuota));
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, storageQuotaLimit: parseInt(newQuota) } : u));
      setEditing((prev) => { const e = { ...prev }; delete e[userId]; return e; });
      showMsg('Quota updated successfully.');
    } catch {
      showMsg('Failed to update quota.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-chrome-section px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">F36 — Storage & Quota Management</span>
        <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide bg-white text-chrome-section px-3 py-1 hover:bg-row-hover transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {msg && <div className="bg-row-selected border border-accent-teal px-4 py-2 text-sm text-text-dark">{msg}</div>}
      {error && (
        <div className="bg-panel border border-border-light p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-text-dark">{error}</span>
        </div>
      )}

      <div className="bg-panel border border-border-light overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-text-medium text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-input">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Storage Used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide w-48">Usage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Quota Limit (MB)</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const usedMB  = ((u.storageQuotaUsed || 0) / (1024 * 1024)).toFixed(1);
                const limitMB = u.storageQuotaLimit || QUOTA_LIMIT_MB;
                const pct     = Math.min(((u.storageQuotaUsed || 0) / (limitMB * 1024 * 1024)) * 100, 100).toFixed(0);
                return (
                  <tr key={u._id} className={`border-b border-border-light hover:bg-row-hover ${i % 2 === 0 ? 'bg-panel' : 'bg-input/40'}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-dark">{u.fullName}</div>
                      <div className="text-xs text-text-medium">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-text-medium font-mono text-xs">{usedMB} MB</td>
                    <td className="px-4 py-3">
                      <QuotaBar used={u.storageQuotaUsed || 0} limit={limitMB * 1024 * 1024} />
                      <div className="text-xs text-text-light mt-1">{pct}% used</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="50" max="5000"
                        value={editing[u._id] ?? limitMB}
                        onChange={(e) => setEditing({ ...editing, [u._id]: e.target.value })}
                        className="w-24 px-2 py-1 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {editing[u._id] !== undefined && (
                        <button onClick={() => handleQuotaSave(u._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide bg-chrome-section text-white hover:opacity-90">
                          <Save className="w-3 h-3" /> Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
