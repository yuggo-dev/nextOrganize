import { call, saveSessionToken } from '../../shared/http/client.js';
const authenticate = async (path, data) => {
  const response = await call(path, { method: 'POST', body: data });
  if (response.token) saveSessionToken(response.token);
  return response;
};
export const authApi = {
  me: async () => {
    const result = await call('/auth/me');
    if (!result.user) saveSessionToken(null);
    return result;
  },
  register: data => authenticate('/auth/register', data),
  login: data => authenticate('/auth/login', data),
  logout: async () => {
    const result = await call('/auth/logout', { method: 'POST' });
    saveSessionToken(null);
    return result;
  },
};
