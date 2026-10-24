// Tiny localStorage helpers: recents, "seen" version names, file dates, JSON template.
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full/blocked */ } };

// ---- Recently visited (ordered names, newest first) ----
export const getRecents = () => read('uh-recent', []);
export function pushRecent(name) {
  const next = [name, ...getRecents().filter((n) => n !== name)].slice(0, 50);
  write('uh-recent', next);
  return next;
}

// ---- Seen version names per repo: anything not in here is "new" ----
export const getSeen = () => read('uh-seen', null);
export const setSeen = (all) => write('uh-seen', all);

// ---- File creation dates (repo -> path -> ISO) ----
export const getDates = (repo) => (read('uh-dates', {})[repo] || {});
export function saveDates(repo, map) {
  if (!Object.keys(map).length) return;
  const all = read('uh-dates', {});
  all[repo] = { ...(all[repo] || {}), ...map };
  write('uh-dates', all);
}

// ---- Cached repo list (instant open, fewer GitHub calls) ----
export const getRepoCache = () => read('uh-repos', null);
export const setRepoCache = (repos, t) => write('uh-repos', { t, repos });
export const memo = new Map(); // per-app version cache for this session
export function clearCache() {
  try { localStorage.removeItem('uh-repos'); } catch { /* ignore */ }
  memo.clear();
}

// ---- Theme ----
export const getTheme = () => {
  try { return { mode: localStorage.getItem('uh-mode') || 'auto', color: localStorage.getItem('uh-color') || 'blue' }; }
  catch { return { mode: 'auto', color: 'blue' }; }
};
export function applyTheme(mode, color) {
  const d = document.documentElement;
  d.dataset.mode = mode === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : mode;
  d.dataset.color = color;
  try { localStorage.setItem('uh-mode', mode); localStorage.setItem('uh-color', color); } catch { /* ignore */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(d).getPropertyValue('--bg').trim();
}

// ---- Default JSON for new versions ----
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

// ---- Helpers ----
export function ago(iso) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' });
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
      const v = (repo.version_names || []).filter((n) => n.toLowerCase().includes(t));
      if (!v.length) return null;
      score += 1;
      hits.push(...v);
    }
  }
  return { score, hits: [...new Set(hits)] };
}
