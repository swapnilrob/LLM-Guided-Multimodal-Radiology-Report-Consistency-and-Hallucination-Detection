import API from './axios';

// POST /api/auth/register — create a new account
export const registerUser = async (fullName, email, password) => {
  const response = await API.post('/auth/register', {
    fullName,
    email,
    password,
  });
  return response.data;
};

// POST /api/auth/login — sign in with email and password
export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

// POST /api/auth/logout — sign out
export const logoutUser = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

// GET /api/auth/me — get the currently logged-in user's profile
export const getMe = async (token) => {
  const response = await API.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}; 