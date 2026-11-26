let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request(path, method = 'GET', payload) {
  const res = await fetch(path, { method, headers: JSON_HEADERS, body: payload && JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export const api = {
  me: () => fetch('/api/auth/me').then((r) => r.json()),
  login: (password) =>
    fetch('/api/auth/password', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ password }) }).then((r) => r.json()),
  logout: () => fetch('/api/auth/logout', { method: 'POST' }),
  repos: () => request('/api/repos'),
  createRepo: (name, version, content) => request('/api/create-repo', 'POST', { name, version, content }),
  versions: (repo, want) => request('/api/versions', 'POST', { repo, want }),
  saveFile: (repo, path, content, sha) => request('/api/file', 'PUT', { repo, path, content, sha }),
  deleteFile: (repo, path, sha) => request('/api/file', 'DELETE', { repo, path, sha }),
  commit: (repo, files, message) => request('/api/commit', 'POST', { repo, files, message }),
};
