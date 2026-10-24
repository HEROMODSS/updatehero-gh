// Remembers each version file's creation date in the browser so the server
// only has to look up dates for files it hasn't seen before.
const KEY = 'uh-added-dates';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* storage full or blocked */ }
}

export function getDates(repo) {
  return read()[repo] || {};
}

export function saveDates(repo, map) {
  if (!Object.keys(map).length) return;
  const all = read();
  all[repo] = { ...(all[repo] || {}), ...map };
  write(all);
}

export function forgetDate(repo, path) {
  const all = read();
  if (all[repo] && all[repo][path]) {
    delete all[repo][path];
    write(all);
  }
}
