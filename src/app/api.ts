const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (username: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getMe: () => request('/auth/me'),

  // Scribbles
  getScribbles: () => request('/scribbles'),

  saveScribble: (scribble: { id: string; timestamp: string; imageData: string; emoji: string[]; tags: string[]; description: string; name?: string }) =>
    request('/scribbles', { method: 'POST', body: JSON.stringify(scribble) }),

  syncScribbles: (scribbles: Array<{ id: string; timestamp: string; imageData: string; emoji: string[]; tags: string[]; description: string; name?: string }>) =>
    request('/scribbles/sync', { method: 'POST', body: JSON.stringify({ scribbles }) }),

  deleteScribble: (id: string) =>
    request(`/scribbles/${id}`, { method: 'DELETE' }),

  updateScribble: (id: string, data: { emoji: string[]; tags: string[]; description: string; name?: string }) =>
    request(`/scribbles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAccount: () =>
    request('/auth/account', { method: 'DELETE' }),
};
