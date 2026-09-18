import { useState, useEffect } from 'react';
import { Megaphone, Trash2, AlertTriangle, Plus, X } from 'lucide-react';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../api/adminApi';

const ROLES = ['all', 'general_user', 'clinician', 'admin'];

export default function AnnouncementBroadcaster() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [msg, setMsg]                     = useState('');
  const [showForm, setShowForm]           = useState(false);

  const [form, setForm] = useState({
    title:      '',
    body:       '',
    targetRole: 'all',
    expiresAt:  '',
  });

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.data.data ?? []);
      setError('');
    } catch {
      setError('Could not load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showMsg('Title and body are required.');
      return;
    }
    try {
      await createAnnouncement(form);
      setForm({ title: '', body: '', targetRole: 'all', expiresAt: '' });
      setShowForm(false);
      fetchAnnouncements();
      showMsg('Announcement published successfully.');
    } catch {
      showMsg('Failed to publish announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      showMsg('Announcement deleted.');
    } catch {
      showMsg('Failed to delete announcement.');
    }
  };

  const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="bg-chrome-section px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F37 — Announcement Broadcaster
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide
                     bg-white text-chrome-section px-3 py-1 hover:bg-row-hover transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {/* Action message */}
      {msg && (
        <div className="bg-row-selected border border-accent-teal px-4 py-2 text-sm text-text-dark">
          {msg}
        </div>
      )}

      {/* Compose form */}
      {showForm && (
        <div className="bg-panel border border-border-light p-4 space-y-3">
          <div className="bg-chrome-section px-3 py-1.5 mb-3">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">
              Compose Announcement
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Scheduled maintenance on Saturday"
              className="w-full px-3 py-2 text-sm border border-border-light bg-input
                         text-text-dark focus:outline-none focus:border-border-focus"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
              Message Body *
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the full announcement text here..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border-light bg-input
                         text-text-dark focus:outline-none focus:border-border-focus resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target role */}
            <div>
              <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
                Target Role
              </label>
              <select
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-light bg-input
                           text-text-dark focus:outline-none focus:border-border-focus"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r === 'all' ? 'All users' : r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Expiry date */}
            <div>
              <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border-light bg-input
                           text-text-dark focus:outline-none focus:border-border-focus"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase
                         tracking-wide bg-button-accept-bg text-white border-2
                         border-button-accept-border hover:opacity-90 transition-opacity"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Publish Announcement
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-panel border border-border-light p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-status-hallucinated" />
          <span className="text-sm text-text-dark">{error}</span>
        </div>
      )}

      {/* Announcements list */}
      <div className="bg-panel border border-border-light">
        {loading ? (
          <div className="p-8 text-center text-text-medium text-sm">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-sm">
            No announcements yet. Click "New Announcement" to create one.
          </div>
        ) : (
          announcements.map((a, i) => (
            <div
              key={a._id}
              className={`p-4 border-b border-border-light last:border-b-0
                          ${isExpired(a.expiresAt) ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm text-text-dark">{a.title}</span>
                    {/* Target role badge */}
                    <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-border-light text-text-medium rounded">
                      {a.targetRole === 'all' ? 'All users' : a.targetRole?.replace('_', ' ')}
                    </span>
                    {/* Expired badge */}
                    {isExpired(a.expiresAt) && (
                      <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-status-hallucinated text-white rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-medium mb-2">{a.body}</p>
                  <div className="text-xs text-text-light">
                    Published: {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                    {a.expiresAt && ` · Expires: ${new Date(a.expiresAt).toLocaleString()}`}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(a._id)}
                  className="p-1.5 text-text-medium hover:text-status-hallucinated transition-colors flex-shrink-0"
                  title="Delete announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
