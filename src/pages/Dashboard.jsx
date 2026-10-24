import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Menu from '../components/Menu.jsx';
import AppCard from '../components/AppCard.jsx';
import AppView from '../components/AppView.jsx';
import AllApps from '../components/AllApps.jsx';
import EditModal from '../components/EditModal.jsx';
import Modal from '../components/Modal.jsx';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import { getRecents, pushRecent, getSeen, setSeen, getTemplate, setTemplate, matchRepo, getRepoCache, setRepoCache, clearCache, ago } from '../store.js';

const PAGE = 10;
const TTL = 10 * 60 * 1000; // repo list is reused for 10 min; 🔄 forces a fresh call
const HOME = { page: 'home' };

export default function Dashboard({ onLogout }) {
  const [cached] = useState(getRepoCache);
  const fetchedAt = useRef(cached ? cached.t : 0);
  const [repos, setRepos] = useState(cached ? cached.repos : null);
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(HOME);
  const [recents, setRecents] = useState(getRecents);
  const [seen, setSeenState] = useState(getSeen);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [modal, setModal] = useState(null); // 'new' | 'tpl'
  const [newName, setNewName] = useState('');
  const [newErr, setNewErr] = useState('');
  const [creating, setCreating] = useState(false);

  // ---- data ----
  const updateSeen = (fn) => setSeenState((s) => { const next = fn({ ...(s || {}) }); setSeen(next); return next; });

  const load = useCallback(async () => {
    setLoadErr(''); setBusy(true);
    try {
      const { repos } = await api.repos();
      fetchedAt.current = Date.now();
      setRepos(repos);
    } catch (e) {
      setLoadErr(e.message);
    }
    setBusy(false);
  }, []);

  useEffect(() => { if (Date.now() - fetchedAt.current > TTL) load(); }, [load]);

  // Persist the list; first run treats every current file as already seen (no NEW flood).
  useEffect(() => {
    if (!repos || !fetchedAt.current) return;
    setRepoCache(repos, fetchedAt.current);
    if (!getSeen()) {
      const base = {};
      repos.forEach((r) => { base[r.name] = r.version_names; });
      setSeen(base);
      setSeenState(base);
    }
  }, [repos]);

  // ---- navigation (browser/Android back button works) ----
  const go = (v) => { history.pushState(v, ''); setView(v); window.scrollTo(0, 0); };
  const back = () => history.back();
  useEffect(() => {
    const pop = (e) => setView(e.state || HOME);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  const open = (name) => {
    setRecents(pushRecent(name));
    const r = byName.get(name);
    if (r) updateSeen((s) => ({ ...s, [name]: r.version_names }));
    go({ page: 'app', name });
  };

  // AppView reports the real file list after loading/adding/deleting.
  const onNames = useCallback((name, names) => {
    setRepos((rs) => rs && rs.map((r) =>
      r.name === name && r.version_names.join('|') !== names.join('|') ? { ...r, version_names: names } : r));
    updateSeen((s) => ({ ...s, [name]: names }));
  }, []);

  const createApp = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!/^[A-Za-z0-9._-]+$/.test(name)) { setNewErr('Use letters, numbers, dot, dash or underscore.'); return; }
    setNewErr(''); setCreating(true);
    try {
      const repo = await api.createRepo(name);
      setRepos((rs) => [repo, ...(rs || [])]);
      updateSeen((s) => ({ ...s, [repo.name]: [] }));
      setModal(null); setNewName('');
      setRecents(pushRecent(repo.name));
      go({ page: 'app', name: repo.name });
    } catch (e2) {
      setNewErr(e2.message);
    }
    setCreating(false);
  };

  const logout = async () => { clearCache(); await api.logout().catch(() => {}); onLogout(); };

  // ---- derived lists ----
  const byName = useMemo(() => new Map((repos || []).map((r) => [r.name, r])), [repos]);
  const isNew = useCallback(
    (r) => !!seen && (r.version_names || []).some((n) => !(seen[r.name] || []).includes(n)),
    [seen]
  );

  const tokens = useMemo(() => search.trim().toLowerCase().split(/\s+/).filter(Boolean), [search]);

  const results = useMemo(() => {
    if (!repos || !tokens.length) return null;
    return repos
      .map((r) => ({ r, m: matchRepo(r, tokens) }))
      .filter((x) => x.m)
      .sort((a, b) => b.m.score - a.m.score || new Date(b.r.updated_at) - new Date(a.r.updated_at));
  }, [repos, tokens]);

  // Recently visited: apps with new files first, then the ones you opened last.
  const recent = useMemo(() => {
    if (!repos) return [];
    const fresh = repos.filter(isNew);
    const ids = new Set(fresh.map((r) => r.name));
    const seenList = recents.map((n) => byName.get(n)).filter((r) => r && !ids.has(r.name));
    return [...fresh, ...seenList];
  }, [repos, recents, isNew, byName]);

  useEffect(() => setLimit(PAGE), [search]);

  const list = results ? results.map((x) => ({ ...x.r, hits: x.m.hits })) : recent;
  const repoOf = (name) => byName.get(name);

  // ---- render ----
  let body;
  if (view.page === 'app' && repoOf(view.name)) {
    body = <AppView key={view.name} repo={repoOf(view.name)} onBack={back} onNames={onNames} />;
  } else if (view.page === 'all') {
    body = <AllApps repos={repos || []} onBack={back} onOpen={open} />;
  } else {
    body = (
      <>
        <div className="search">
          <Icon n="search" s={16} />
          <input className="input" type="search" placeholder="Search apps or versions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="row-between sub">
          <span>{results ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recently visited'}</span>
          <span className="row">
            {fetchedAt.current > 0 && <small>{ago(new Date(fetchedAt.current).toISOString())}</small>}
            <button className={`icon-btn sm${busy ? ' spin' : ''}`} onClick={load} disabled={busy} title="Refresh"><Icon n="refresh" /></button>
          </span>
        </div>

        {loadErr && <div className="err">{loadErr}</div>}
        {repos === null ? (
          !loadErr && <div className="list"><i className="sk" /><i className="sk" /><i className="sk" /></div>
        ) : (
          <div className="list">
            {list.slice(0, limit).map((r) => (
              <AppCard key={r.name} repo={r} hits={r.hits} isNew={isNew(r)} onOpen={open} />
            ))}
            {!list.length && (
              <p className="muted center">{results ? 'No apps or versions match.' : 'Nothing here yet. Search for an app or open Menu → All apps.'}</p>
            )}
          </div>
        )}
        {list.length > limit && (
          <button className="btn ghost wide" onClick={() => setLimit(limit + PAGE)}>Show more ({list.length - limit})</button>
        )}
      </>
    );
  }

  return (
    <div className="wrap">
      <header>
        <div className="brand"><img src="/logo.png" alt="" width="26" height="26" />UpdateHero</div>
        <Menu onNew={() => setModal('new')} onAll={() => go({ page: 'all' })} onTemplate={() => setModal('tpl')} onLogout={logout} />
      </header>

      {body}

      {modal === 'new' && (
        <Modal title="New app" onClose={() => setModal(null)}>
          <form className="col" onSubmit={createApp}>
            <input className="input" autoFocus placeholder="App name (GitHub repo)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            {newErr && <div className="err">{newErr}</div>}
            <button className="btn" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
          </form>
        </Modal>
      )}
      {modal === 'tpl' && (
        <EditModal title="Default JSON for new versions" initialJson={getTemplate()} onClose={() => setModal(null)} onSave={async (c) => setTemplate(c)} />
      )}
    </div>
  );
}
