let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

const body = (o) => JSON.stringify(o);

export const api = {
  me: () => fetch('/api/auth/me').then((r) => r.json()),
  login: (password) =>
    fetch('/api/auth/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body({ password }) }).then((r) => r.json()),
  logout: () => fetch('/api/auth/logout', { method: 'POST' }),
  repos: () => request('/api/repos'),
  createRepo: (name) => request('/api/create-repo', { method: 'POST', body: body({ name }) }),
  versions: (repo, known) => request('/api/versions', { method: 'POST', body: body({ repo, known }) }),
  saveFile: (repo, path, content, sha) => request('/api/file', { method: 'PUT', body: body({ repo, path, content, sha }) }),
  deleteFile: (repo, path, sha) => request('/api/file', { method: 'DELETE', body: body({ repo, path, sha }) }),
};
