const TOKEN_KEY = 'uh-gh-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export const api = {
  login: (password) =>
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).then((r) => r.json()),
  repos: () => request('/api/repos'),
  createRepo: (name) => request('/api/create-repo', { method: 'POST', body: JSON.stringify({ name }) }),
  versions: (repo) => request(`/api/versions?repo=${encodeURIComponent(repo)}`),
  saveFile: (repo, path, content, sha) =>
    request('/api/file', { method: 'PUT', body: JSON.stringify({ repo, path, content, sha }) }),
  deleteFile: (repo, path, sha) =>
    request('/api/file', { method: 'DELETE', body: JSON.stringify({ repo, path, sha }) }),
};
