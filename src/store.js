// localStorage helpers: recents (this browser only), file dates, default JSON, theme, toast.
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full/blocked */ } };

// Recently visited (names, newest first)
export const getRecents = () => read('uh-recent', []);
export function pushRecent(name) {
  const next = [name, ...getRecents().filter((n) => n !== name)].slice(0, 50);
  write('uh-recent', next);
  return next;
}
export const clearRecents = () => write('uh-recent', []);

// File creation dates (repo -> path -> ISO). A file's creation date never changes.
export const getDates = (repo) => (read('uh-dates', {})[repo] || {});
export function saveDates(repo, map) {
  if (!Object.keys(map).length) return;
  const all = read('uh-dates', {});
  all[repo] = { ...(all[repo] || {}), ...map };
  write('uh-dates', all);
}

// Per-app version lists, kept in memory for the current page session only
export const memo = new Map();

// Default JSON for new versions
const FALLBACK = {
  enabled: true,
  title: 'Update Available!',
  points: [
    'Can’t wait to see you in the new version.',
    'Click “Update Now” to download the latest version from our Telegram channel.',
  ],
  update_link: 'https://t.me/heromodss/',
  cancel_text: 'NOT NOW',
  update_text: 'UPDATE NOW',
};
export const getTemplate = () => read('uh-template', null) || JSON.stringify(FALLBACK, null, 2);
export const setTemplate = (json) => write('uh-template', json);

// Content for a brand-new version: the default JSON, switched OFF (people already on the newest version need no update prompt).
export function newVersionJson() {
  let o;
  try { o = JSON.parse(getTemplate()); } catch { o = { ...FALLBACK }; }
  return JSON.stringify({ ...o, enabled: false }, null, 2);
}
export function withEnabled(raw, on) {
  return JSON.stringify({ ...JSON.parse(raw), enabled: on }, null, 2);
}

// Theme accents. Each app icon takes one of these, picked from its name.
export const ACCENTS = {
  indigo: '#6366F1', emerald: '#10B981', rose: '#F43F5E', amber: '#F59E0B',
  sky: '#0EA5E9', violet: '#8B5CF6', teal: '#14B8A6', orange: '#F97316',
};
export const toneOf = (name) => {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  return Math.abs(h) % Object.keys(ACCENTS).length;
};

// Theme: style ('glass' = Liquid Glass, 'md3' = minimal Material 3) + mode + accent colour.
export const getTheme = () => {
  try {
    return {
      style: localStorage.getItem('uh-style') || 'glass',
      mode: localStorage.getItem('uh-mode') || 'auto',
      color: localStorage.getItem('uh-color') || 'indigo',
    };
  } catch { return { style: 'glass', mode: 'auto', color: 'indigo' }; }
};
export function applyTheme(mode, color, style = getTheme().style) {
  const d = document.documentElement;
  d.dataset.mode = mode === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : mode;
  d.dataset.color = color;
  d.dataset.style = style;
  try {
    localStorage.setItem('uh-mode', mode);
    localStorage.setItem('uh-color', color);
    localStorage.setItem('uh-style', style);
    if (mode === 'dark' || mode === 'amoled') localStorage.setItem('uh-dark', mode);
  } catch { /* ignore */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(d).getPropertyValue('--bg').trim();
  window.dispatchEvent(new Event('uh-theme'));
}
// Quick light <-> dark switch (returns to your last dark variant).
export function flipTheme() {
  const cur = document.documentElement.dataset.mode;
  let dark = 'dark';
  try { dark = localStorage.getItem('uh-dark') || 'dark'; } catch { /* ignore */ }
  const t = getTheme();
  applyTheme(cur === 'light' ? dark : 'light', t.color, t.style);
}

// Toast (shown by <Toast/>)
export const toast = (msg, bad = false) => window.dispatchEvent(new CustomEvent('uh-toast', { detail: { msg, bad } }));

// Helpers
export function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Search: every word must match the app name or one of its version files.
export function matchRepo(repo, tokens) {
  const name = repo.name.toLowerCase();
  const hits = [];
  let score = 0;
  for (const t of tokens) {
    if (name.startsWith(t)) score += 3;
    else if (name.includes(t)) score += 2;
    else {
      const v = repo.version_names.filter((n) => n.toLowerCase().includes(t));
      if (!v.length) return null;
      score += 1;
      hits.push(...v);
    }
  }
  return { score, hits: [...new Set(hits)] };
}

// Shown in the UI so you can confirm which build is deployed (date = when Vercel built it).
export const BUILD = `v6 · ${typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev'}`;
