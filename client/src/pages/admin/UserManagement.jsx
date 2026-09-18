import { useState, useEffect } from 'react';
import { Search, Shield, UserX, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAllUsers, updateUserRole, suspendUser, deleteUser } from '../../api/adminApi';

const ROLES = ['general_user', 'clinician', 'admin'];

function RoleBadge({ role }) {
  const styles = {
    admin:        'bg-status-hallucinated text-white',
    clinician:    'bg-status-mismatch text-white',
    general_user: 'bg-border-light text-text-medium',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${styles[role] ?? styles.general_user}`}>
      {role?.replace('_', ' ')}
    </span>
  );
}

function StatusBadge({ suspended }) {
  return suspended
    ? <span className="px-2 py-0.5 text-xs font-semibold rounded uppercase bg-status-hallucinated text-white">Suspended</span>
    : <span className="px-2 py-0.5 text-xs font-semibold rounded uppercase bg-status-verified text-white">Active</span>;
}

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ search });
      setUsers(res.data.data ?? []);
      setError('');
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role } : u));
      showMsg('Role updated successfully.');
    } catch {
      showMsg('Failed to update role.');
    }
  };

  const handleSuspend = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await suspendUser(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
      showMsg('User suspension status updated.');
    } catch {
      showMsg('Failed to update suspension.');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showMsg('User deleted.');
    } catch {
      showMsg('Failed to delete user.');
    }
  };

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="bg-chrome-section px-4 py-2">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F33 — User Management
        </span>
      </div>

      {/* Toolbar */}
      <div className="bg-panel border border-border-light p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border-light bg-input
                       text-text-dark focus:outline-none focus:border-border-focus"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase
                     border border-border-light text-text-medium hover:text-text-dark
                     hover:bg-row-hover transition-colors tracking-wide"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="bg-row-selected border border-accent-teal px-4 py-2 text-sm text-text-dark">
          {actionMsg}
        </div>
      )}

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
          <div className="p-8 text-center text-text-medium text-sm">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-light bg-input">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-medium uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u._id}
                  className={`border-b border-border-light transition-colors hover:bg-row-hover
                              ${i % 2 === 0 ? 'bg-panel' : 'bg-input/40'}`}
                >
                  <td className="px-4 py-3 font-medium text-text-dark">{u.fullName}</td>
                  <td className="px-4 py-3 text-text-medium">{u.email}</td>

                  {/* Role selector */}
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="text-xs border border-border-light bg-input px-2 py-1
                                 text-text-dark focus:outline-none focus:border-border-focus"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge suspended={u.isSuspended} />
                  </td>

                  <td className="px-4 py-3 text-text-medium text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>

                  {/* Action buttons */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSuspend(u._id)}
                        title={u.isSuspended ? 'Unsuspend user' : 'Suspend user'}
                        className="p-1.5 text-text-medium hover:text-status-mismatch transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        title="Delete user permanently"
                        className="p-1.5 text-text-medium hover:text-status-hallucinated transition-colors"
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

      {/* Count */}
      {!loading && (
        <div className="text-xs text-text-light px-1">
          Showing {filtered.length} of {users.length} users
        </div>
      )}
    </div>
  );
}
