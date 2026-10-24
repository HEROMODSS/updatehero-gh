// Shared helpers for all /api functions.
// Env: ADMIN_PASSWORD, GITHUB_TOKEN, GITHUB_OWNER, SESSION_SECRET (optional but recommended).

import crypto from 'crypto';

const GITHUB_API = 'https://api.github.com';
export const COOKIE = '__Host-uh'; // __Host- prefix: Secure, Path=/, no Domain — can't be set by subdomains
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const cookieAttrs = 'HttpOnly; Secure; SameSite=Strict; Path=/';

// ---------- Session (signed cookie) ----------

const secret = () =>
  process.env.SESSION_SECRET ||
  (process.env.ADMIN_PASSWORD && process.env.GITHUB_TOKEN
    ? crypto.createHash('sha256').update(`${process.env.ADMIN_PASSWORD}::${process.env.GITHUB_TOKEN}`).digest('hex')
    : null);

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const hmac = (data) => crypto.createHmac('sha256', secret()).update(data).digest('hex');
export const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

export function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${hmac(data)}`;
}

function verifySession(token) {
  if (!token || !secret()) return null; // fail closed when no secret is configured
  const [data, sig] = token.split('.');
  if (!data || !sig || !safeEqual(hmac(data), sig)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    return p.exp && Date.now() < p.exp ? p : null;
  } catch {
    return null;
  }
}

function cookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

// Cookie check + CSRF guard: state-changing requests must come from our own origin.
export function checkAuth(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    if (!origin) return false;
    try { if (new URL(origin).host !== req.headers.host) return false; } catch { return false; }
  }
  return !!verifySession(cookie(req, COOKIE));
}

export const unauthorized = (res) => res.status(401).json({ error: 'unauthorized' });

export function sendError(res, e) {
  const status = e.status || 500;
  res.status(status).json({ error: status >= 500 ? 'Server error. Try again.' : e.message, retryAfter: e.retryAfter });
}

// Names that are safe to put in a GitHub URL path (no "." / "..", no slashes).
export const validName = (n) => typeof n === 'string' && n.length <= 100 && /^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(n);

// ---------- GitHub API ----------

function rateLimited(res, json) {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');
  const retry = res.headers.get('retry-after');
  const limited = (res.status === 403 || res.status === 429) && (remaining === '0' || /rate limit/i.test((json && json.message) || ''));
  if (!limited) return null;
  const wait = retry ? Number(retry) || 300 : reset ? Math.max(30, Number(reset) - Math.floor(Date.now() / 1000)) : 300;
  const err = new Error(`GitHub rate limit reached. Try again in about ${Math.ceil(wait / 60)} min.`);
  err.status = 429;
  err.retryAfter = wait;
  return err;
}

async function call(path, options, isGraphQL) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'updatehero-gh-panel',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  const rl = rateLimited(res, json);
  if (rl) throw rl;
  if (!res.ok) {
    const err = new Error((json && json.message) || `GitHub API error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  if (isGraphQL && json.errors && json.errors.length) {
    if (json.errors.some((e) => e.type === 'RATE_LIMITED')) {
      const err = new Error('GitHub rate limit reached. Try again in about 5 min.');
      err.status = 429;
      err.retryAfter = 300;
      throw err;
    }
    if (!json.data || (!json.data.repository && !json.data.viewer)) {
      const err = new Error(json.errors[0].message);
      err.status = json.errors[0].type === 'NOT_FOUND' ? 404 : 502;
      throw err;
    }
  }
  return isGraphQL ? json.data : json;
}

export const gh = (path, options = {}) => call(path, options, false);
export const ghGraphQL = (query, variables = {}) =>
  call('/graphql', { method: 'POST', body: JSON.stringify({ query, variables }) }, true);

export const owner = () => process.env.GITHUB_OWNER;
export const b64encode = (str) => Buffer.from(str, 'utf-8').toString('base64');

// Root files that are never treated as versions.
export const IGNORED_FILES = new Set(['README.md', 'readme.md', 'LICENSE', 'LICENSE.md', 'package.json']);
export const isVersionFile = (e) => e.type === 'blob' && !e.name.startsWith('.') && !IGNORED_FILES.has(e.name);
