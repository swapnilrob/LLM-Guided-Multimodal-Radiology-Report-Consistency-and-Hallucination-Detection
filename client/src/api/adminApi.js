import API from './axios';

// ── Metrics (F32) ──────────────────────────────────────────
export const getSystemMetrics = () => API.get('/admin/metrics');

// ── Users (F33) ────────────────────────────────────────────
export const getAllUsers      = (params) => API.get('/admin/users', { params });
export const updateUserRole   = (userId, role) => API.patch(`/admin/users/${userId}/role`, { role });
export const suspendUser      = (userId) => API.patch(`/admin/users/${userId}/suspend`);
export const deleteUser       = (userId) => API.delete(`/admin/users/${userId}`);

// ── Audit Logs (F35) ───────────────────────────────────────
export const getAuditLogs     = (params) => API.get('/admin/audit-logs', { params });

// ── Announcements (F37) ────────────────────────────────────
export const getAnnouncements    = () => API.get('/admin/announcements');
export const createAnnouncement  = (data) => API.post('/admin/announcements', data);
export const deleteAnnouncement  = (id) => API.delete(`/admin/announcements/${id}`);
