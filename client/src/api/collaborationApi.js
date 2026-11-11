import API from './axios';

// --- F40: Sharing ---
export const shareAnalysis = async (data) => {
  const res = await API.post('/collaboration/share', data);
  return res.data;
};

export const getSharedAnalysis = async (token) => {
  const res = await API.get(`/collaboration/shared/${token}`);
  return res.data;
};

export const getSharesForAnalysis = async (analysisId) => {
  const res = await API.get(`/collaboration/shares/${analysisId}`);
  return res.data;
};

export const revokeShare = async (shareId) => {
  const res = await API.patch(`/collaboration/share/${shareId}/revoke`);
  return res.data;
};

export const getSharedWithMe = async () => {
  const res = await API.get('/collaboration/shared-with-me');
  return res.data;
};

// --- F44: Feedback ---
export const submitFeedback = async (data) => {
  const res = await API.post('/collaboration/feedback', data);
  return res.data;
};

export const getFeedbackForAnalysis = async (analysisId) => {
  const res = await API.get(`/collaboration/feedback/${analysisId}`);
  return res.data;
};

// --- F41: Annotations ---
export const createAnnotation = async (data) => {
  const res = await API.post('/collaboration/annotations', data);
  return res.data;
};

export const getAnnotations = async (analysisId) => {
  const res = await API.get(`/collaboration/annotations/${analysisId}`);
  return res.data;
};