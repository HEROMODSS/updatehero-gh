// Shared helpers for all /api functions.
// Env vars required (set in Vercel → Settings → Environment Variables):
//   ADMIN_PASSWORD  — password you type into the panel to log in
//   GITHUB_TOKEN    — a GitHub Personal Access Token with "repo" scope
//   GITHUB_OWNER    — your GitHub username, e.g. HEROMODSS

const GITHUB_API = 'https://api.github.com';

export function checkAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  return token && token === process.env.ADMIN_PASSWORD;
}

export function unauthorized(res) {
  res.status(401).json({ error: 'unauthorized' });
}

export async function gh(path, options = {}) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'updatehero-gh-panel',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    const err = new Error((json && json.message) || `GitHub API error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json;
}

export function owner() {
  return process.env.GITHUB_OWNER;
}

export function b64encode(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function b64decode(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

// Files we never treat as "version" entries when listing a repo's root.
export const IGNORED_FILES = new Set([
  'README.md', 'readme.md', '.gitignore', '.gitattributes', 'LICENSE', 'LICENSE.md',
]);
