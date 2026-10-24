import React, { useEffect, useMemo, useRef, useState } from 'react';
import VersionRow from './VersionRow.jsx';
import { api } from '../api.js';
import Icon from './Icon.jsx';
import { getDates, saveDates, getTemplate, memo } from '../store.js';

const PAGE = 10;
const FRESH = 3 * 60 * 1000;
const byNewest = (a, b) =>
  new Date(b.added_at || 0) - new Date(a.added_at || 0) ||
  b.name.localeCompare(a.name, undefined, { numeric: true });

export default function AppView({ repo, onBack, onNames }) {
  const hit = () => { const m = memo.get(repo.name); return m && Date.now() - m.t < FRESH ? m : null; };
  const [versions, setVersions] = useState(() => (hit() ? hit().versions : null));
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const at = useRef(hit() ? hit().t : 0);
  const [limit, setLimit] = useState(PAGE);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const busy = useRef(0); // >0 while a write is in flight
  const names = useRef(onNames);
  names.current = onNames;

  const load = async () => {
    setErr(''); setLoading(true);
    try {
      const stored = getDates(repo.name);
      // Only ask GitHub for dates we don't already have (a file's creation date never changes).
      const want = repo.version_names.filter((n) => !stored[n]);
      const { versions: fresh } = await api.versions(repo.name, want);
      at.current = Date.now();
      const learned = {};
      setVersions(fresh.map((v) => {
        if (v.added_at) learned[v.path] = v.added_at;
        return { ...v, added_at: v.added_at || stored[v.path] || null };
      }));
      saveDates(repo.name, learned);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { if (!hit()) load(); /* eslint-disable-next-line */ }, [repo.name]);
  useEffect(() => {
    if (!versions) return;
    memo.set(repo.name, { t: at.current, versions: versions.map(({ busy, ...v }) => v) });
    names.current(repo.name, versions.map((v) => v.name));
  }, [versions, repo.name]);

  const sorted = useMemo(() => [...(versions || [])].sort(byNewest), [versions]);
  const live = sorted.filter((v) => v.enabled).length;
  const patch = (path, p) => setVersions((vs) => vs.map((v) => (v.path === path ? { ...v, ...p } : v)));

  const write = async (v, content) => {
    busy.current++;
    try {
      const { sha } = await api.saveFile(repo.name, v.path, content, v.sha);
      let enabled = v.enabled;
      try { enabled = !!JSON.parse(content).enabled; } catch { /* keep */ }
      patch(v.path, { raw: content, sha, enabled, valid_json: true });
    } finally { busy.current--; }
  };

  const toggle = async (v, on) => {
    patch(v.path, { enabled: on, busy: true });
    try {
      const parsed = JSON.parse(v.raw);
      parsed.enabled = on;
      await write(v, JSON.stringify(parsed, null, 2));
    } catch (e) {
      setErr(e.message);
      patch(v.path, { enabled: !on });
    }
    patch(v.path, { busy: false });
  };

  const remove = async (v) => {
    try {
      await api.deleteFile(repo.name, v.path, v.sha);
      setVersions((vs) => vs.filter((x) => x.path !== v.path));
    } catch (e) { setErr(e.message); }
  };

  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!/^[A-Za-z0-9._-]+$/.test(n) || n.startsWith('.')) { setErr('Use letters, numbers, dot, dash or underscore.'); return; }
    if (versions.some((v) => v.name === n)) { setErr('That version already exists.'); return; }
    setErr(''); setAdding(true);
    try {
      const raw = getTemplate();
      const { sha } = await api.saveFile(repo.name, n, raw, null);
      const added_at = new Date().toISOString();
      saveDates(repo.name, { [n]: added_at });
      let enabled = false;
      try { enabled = !!JSON.parse(raw).enabled; } catch { /* ignore */ }
      setVersions((vs) => [...vs, { name: n, path: n, sha, enabled, raw, valid_json: true, added_at }]);
      setName('');
    } catch (e2) { setErr(e2.message); }
    setAdding(false);
  };

  const rawBase = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/`;

  return (
    <>
      <div className="row-between">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon n="back" /></button>
        <div className="title">
          <h2>{repo.name}</h2>
          <small>{versions ? `${versions.length} version${versions.length !== 1 ? 's' : ''} · ${live} live` : ' '}</small>
        </div>
        <button className={`icon-btn${loading ? ' spin' : ''}`} onClick={load} title="Reload" disabled={loading}><Icon n="refresh" /></button>
      </div>

      {err && <div className="err">{err}</div>}

      {versions === null && !err && <div className="list"><i className="sk" /><i className="sk" /></div>}
      <div className="list">
        {sorted.slice(0, limit).map((v) => (
          <VersionRow key={v.path} v={v} rawBase={rawBase} onToggle={toggle} onSave={write} onDelete={remove} />
        ))}
        {versions && !versions.length && <p className="muted center">No versions yet. Add one below.</p>}
      </div>
      {sorted.length > limit && (
        <button className="btn ghost wide" onClick={() => setLimit(limit + PAGE)}>Show more ({sorted.length - limit})</button>
      )}

      <form className="row add" onSubmit={add}>
        <input className="input mono" placeholder="New version, e.g. 1.2.3.json" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={adding || !versions}>{adding ? '…' : 'Add'}</button>
      </form>
    </>
  );
}
