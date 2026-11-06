import API from './axios';

export const createTeam = async (name) => {
  const res = await API.post('/teams', { name });
  return res.data;
};

export const joinTeam = async (inviteCode) => {
  const res = await API.post('/teams/join', { inviteCode });
  return res.data;
};

export const getMyTeams = async () => {
  const res = await API.get('/teams');
  return res.data;
};

export const getTeamById = async (teamId) => {
  const res = await API.get(`/teams/${teamId}`);
  return res.data;
};

export const getTeamAnalyses = async (teamId) => {
  const res = await API.get(`/teams/${teamId}/analyses`);
  return res.data;
};

export const removeMember = async (teamId, userId) => {
  const res = await API.delete(`/teams/${teamId}/members/${userId}`);
  return res.data;
};

export const leaveTeam = async (teamId) => {
  const res = await API.patch(`/teams/${teamId}/leave`);
  return res.data;
};