import API from './axios';

export const createComment = async (data) => {
  const res = await API.post('/comments', data);
  return res.data;
};

export const getComments = async (analysisId) => {
  const res = await API.get(`/comments/${analysisId}`);
  return res.data;
};

export const deleteComment = async (commentId) => {
  const res = await API.delete(`/comments/${commentId}`);
  return res.data;
};