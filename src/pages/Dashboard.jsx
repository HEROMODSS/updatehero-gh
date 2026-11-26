import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import AppCard from '../components/AppCard.jsx';
import AppView from '../components/AppView.jsx';
import AllApps from '../components/AllApps.jsx';
import Dock from '../components/Dock.jsx';
import NewApp from '../components/NewApp.jsx';
import Settings from '../components/Settings.jsx';
import EditModal from '../components/EditModal.jsx';
import Toast from '../components/Toast.jsx';
import Icon from '../components/Icon.jsx';
import Brand from '../components/Brand.jsx';
import { api } from '../api.js';
import { getRecents, pushRecent, clearRecents, getTemplate, setTemplate, newVersionJson, matchRepo, saveDates, memo, toast } from '../store.js';

const PAGE = 10;
const HOME = { page: 'home' };
const Skeleton = () => <div className="list"><i className="sk" /><i className="sk" /><i className="sk" /></div>;

export default function Dashboard({ onLogout }) {
  const [repos, setRepos] = useState(null);
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState(() => (history.state && history.state.page ? history.state : HOME));
  const [recents, setRecents] = useState(getRecents); // only apps opened in THIS browser
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search);
  const [limit, setLimit] = useState(PAGE);
  const [sheet, setSheet] = useState(null); // 'new' | 'more' | 'tpl'

  // ---- data: one GitHub call per page load ----
  const load = useCallback(async () => {
    setErr('');
    try {
      setRepos((await api.repos()).repos);
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ---- navigation (Android back works) ----
  const push = (v) => { history.pushState(v, ''); setView(v); setNotice(''); window.scrollTo(0, 0); };
  const tab = (v) => { history.replaceState(v, ''); setView(v); setNotice(''); window.scrollTo(0, 0); };
  const back = () => history.back();
  useEffect(() => {
    const pop = (e) => setView(e.state && e.state.page ? e.state : HOME);
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);

  const byName = useMemo(() => new Map((repos || []).map((r) => [r.name, r])), [repos]);

  const open = useCallback((name) => {
    setRecents(pushRecent(name));
    push({ page: 'app', name });
  }, []);

  // AppView reports the real file list after loading / adding / deleting (keeps counts + search accurate).
  const onNames = useCallback((name, names) => {
    setRepos((rs) => rs && rs.map((r) =>
      r.name === name && r.version_names.join('|') !== names.join('|') ? { ...r, version_names: names } : r));
  }, []);

  const createApp = async (name, version) => {
    const raw = newVersionJson();
    const r = await api.createRepo(name, version, raw);
    const repo = { name: r.name, full_name: r.full_name, default_branch: r.default_branch, updated_at: r.updated_at, version_names: r.version_names };
    if (r.sha) { // seed the app page so it opens instantly, with no extra GitHub call
      const now = new Date().toISOString();
      memo.set(repo.name, { versions: [{ name: version, sha: r.sha, enabled: false, raw, valid_json: true, added_at: now }] });
      saveDates(repo.name, { [version]: now });
    }
    setRepos((rs) => [repo, ...(rs || [])]);
    setRecents(pushRecent(repo.name));
    setSheet(null);
    push({ page: 'app', name: repo.name });
    if (r.warning) setNotice(`App created, but the first version failed: ${r.warning} Add it below.`);
    else toast('App created');
  };

  const logout = async () => { memo.clear(); await api.logout().catch(() => {}); onLogout(); };

  // ---- lists ----
  const tokens = useMemo(() => query.trim().toLowerCase().split(/\s+/).filter(Boolean), [query]);

  const items = useMemo(() => {
    if (!repos) return [];
    if (tokens.length) {
      return repos
        .map((r) => ({ repo: r, m: matchRepo(r, tokens) }))
        .filter((x) => x.m)
        .sort((a, b) => b.m.score - a.m.score || new Date(b.repo.updated_at) - new Date(a.repo.updated_at))
        .map((x) => ({ repo: x.repo, hits: x.m.hits }));
    }
    // Recently visited = apps YOU opened here, newest first. Nothing is added by other people's changes.
    return recents.map((n) => byName.get(n)).filter(Boolean).map((repo) => ({ repo, hits: null }));
  }, [repos, tokens, recents, byName]);

  useEffect(() => { setLimit(PAGE); }, [query]);

  // ---- render ----
  const searching = tokens.length > 0;
  const current = view.page === 'app' ? byName.get(view.name) : null;
  let body;

  if (current) {
    body = <AppView key={current.name} repo={current} onBack={back} onNames={onNames} />;
  } else if (view.page === 'app' && repos === null && !err) {
    body = <Skeleton />;
  } else if (view.page === 'all') {
    body = <AllApps repos={repos} loading={repos === null && !err} onOpen={open} />;
  } else {
    body = (
      <>
        <div className="hero">
          <h1>Apps</h1>
          <small>{repos ? `${repos.length} on GitHub` : ' '}</small>
        </div>
        <div className="search">
          <Icon n="search" s={16} />
          <input className="input" type="search" placeholder="Search apps or versions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="row-between sub">
          <span>{searching ? `${items.length} result${items.length !== 1 ? 's' : ''}` : 'Recently visited'}</span>
          {!searching && recents.length > 0 && (
            <button className="link" onClick={() => { clearRecents(); setRecents([]); }}>Clear</button>
          )}
        </div>

        {repos === null ? (
          err ? <button className="btn ghost wide" onClick={load}>Try again</button> : <Skeleton />
        ) : (
          <div className="list">
            {items.slice(0, limit).map(({ repo, hits }, i) => (
              <AppCard key={repo.name} repo={repo} hits={hits} i={i} onOpen={open} />
            ))}
            {!items.length && (
              <p className="muted center">{searching ? 'No apps or versions match.' : 'Apps you open show up here. Search above, or tap Apps below.'}</p>
            )}
          </div>
        )}
        {items.length > limit && (
          <button className="btn ghost wide" onClick={() => setLimit(limit + PAGE)}>Show more ({items.length - limit})</button>
        )}
      </>
    );
  }

  return (
    <>
      <header><Brand /></header>
      <main className="wrap">
        {err && <div className="err">{err}</div>}
        {notice && <div className="err">{notice}</div>}
        <div className="page" key={view.page + (view.name || '')}>{body}</div>
      </main>

      <Dock
        active={view.page === 'all' ? 'all' : 'home'}
        onHome={() => tab(HOME)}
        onAll={() => tab({ page: 'all' })}
        onNew={() => setSheet('new')}
        onMore={() => setSheet('more')}
      />
      <Toast />

      {sheet === 'new' && <NewApp onClose={() => setSheet(null)} onCreate={createApp} />}
      {sheet === 'more' && <Settings onClose={() => setSheet(null)} onTemplate={() => setSheet('tpl')} onLogout={logout} />}
      {sheet === 'tpl' && (
        <EditModal title="Default JSON" note="Used for every new app and new version (saved in this browser). New versions are added switched off; older ones can be switched on." initialJson={getTemplate()} onClose={() => setSheet(null)} onSave={async (c) => { setTemplate(c); toast('Default JSON saved'); }} />
      )}
    </>
  );
}
