import API from './axios';

// GET /api/analyses — fetch all analyses for the logged-in user
export const getAnalyses = async (token) => {
  const response = await API.get('/analyses', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// GET /api/analyses/:id — fetch a single analysis with full details
export const getAnalysisById = async (token, id) => {
  const response = await API.get(`/analyses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// POST /api/analyses — submit a new analysis (image + report text)
export const createAnalysis = async (token, formData) => {
  const response = await API.post('/analyses', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// DELETE /api/analyses/:id — delete an analysis
export const deleteAnalysis = async (token, id) => {
  const response = await API.delete(`/analyses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}; 