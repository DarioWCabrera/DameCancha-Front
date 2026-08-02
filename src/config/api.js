const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredApiUrl || 'http://localhost:3000').replace(/\/$/, '');

export const apiUrl = (path = '') => {
  if (!path) return API_URL;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const mediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
};
