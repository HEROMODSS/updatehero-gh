const KEY = 'uh-hidden-repos';

export function getHiddenRepos() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setHiddenRepos(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleHiddenRepo(name) {
  const list = getHiddenRepos();
  const next = list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
  setHiddenRepos(next);
  return next;
}
