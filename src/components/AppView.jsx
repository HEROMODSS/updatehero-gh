import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import VersionRow from './VersionRow.jsx';
import Icon from './Icon.jsx';
import { api } from '../api.js';
import { getDates, saveDates, newVersionJson, withEnabled, memo, toast } from '../store.js';

const PAGE = 10;
const NAME_OK = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;
const byNewest = (a, b) =>
  new Date(b.added_at || 0) - new Date(a.added_at || 0) ||
  b.name.localeCompare(a.name, undefined, { numeric: true });

export default function AppView({ repo, onBack, onNames }) {
  const [versions, setVersions] = useState(() => (memo.get(repo.name) || {}).versions || null);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [name, setName] = useState('');
  const [alsoOn, setAlsoOn] = useState(true); // switch older versions on when adding a new one
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);
  const report = useRef(onNames);
  report.current = onNames;

  // One GitHub call: file contents + creation dates (only for files we have no date for yet).
  const load = async () => {
    setErr('');
    try {
      const stored = getDates(repo.name);
      const { versions: fresh } = await api.versions(repo.name, repo.version_names.filter((n) => !stored[n]));
      const learned = {};
      setVersions(fresh.map((v) => {
        if (v.added_at) learned[v.name] = v.added_at;
        return { ...v, added_at: v.added_at || stored[v.name] || null };
      }));
      saveDates(repo.name, learned);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { if (!memo.has(repo.name)) load(); /* eslint-disable-next-line */ }, [repo.name]);
  useEffect(() => {
    if (!versions) return;
    memo.set(repo.name, { versions: versions.map(({ busy, ...v }) => v) });
    report.current(repo.name, versions.map((v) => v.name));
  }, [versions, repo.name]);

  const sorted = useMemo(() => [...(versions || [])].sort(byNewest), [versions]);
  const live = sorted.filter((v) => v.enabled).length;
  // Older versions that are still off: they need the update prompt switched on.
  const pending = useMemo(() => sorted.filter((v, i) => i > 0 && v.valid_json && !v.enabled), [sorted]);

  const patch = (name2, p) => setVersions((vs) => vs.map((v) => (v.name === name2 ? { ...v, ...p } : v)));

  const write = useCallback(async (v, content) => {
    const { sha } = await api.saveFile(repo.name, v.name, content, v.sha);
    let enabled = v.enabled;
    try { enabled = !!JSON.parse(content).enabled; } catch { /* keep */ }
    patch(v.name, { raw: content, sha, enabled, valid_json: true });
  }, [repo.name]); // eslint-disable-line

  const toggle = useCallback(async (v, on) => {
    patch(v.name, { enabled: on, busy: true });
    try {
      await write(v, withEnabled(v.raw, on));
      toast(on ? `${v.name} is on` : `${v.name} is off`);
    } catch (e) {
      setErr(e.message);
      patch(v.name, { enabled: !on });
    }
    patch(v.name, { busy: false });
  }, [write]);

  const save = useCallback(async (x, c) => { await write(x, c); toast('Saved'); }, [write]);

  const remove = useCallback(async (v) => {
    try {
      await api.deleteFile(repo.name, v.name, v.sha);
      setVersions((vs) => vs.filter((x) => x.name !== v.name));
      toast('Deleted');
    } catch (e) { setErr(e.message); }
  }, [repo.name]);

  // Switch on every older version that is off: ONE commit, whatever the count.
  const enableOlder = async () => {
    if (!pending.length) return;
    setBulk(true); setErr('');
    try {
      const files = pending.map((v) => ({ path: v.name, content: withEnabled(v.raw, true) }));
      const { shas } = await api.commit(repo.name, files, 'Enable older versions');
      setVersions((vs) => vs.map((v) => {
        const f = files.find((x) => x.path === v.name);
        return f ? { ...v, raw: f.content, sha: shas[v.name], enabled: true } : v;
      }));
      toast(`Update on for ${files.length} older version${files.length > 1 ? 's' : ''}`);
    } catch (e) { setErr(e.message); }
    setBulk(false);
  };

  const add = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!NAME_OK.test(n)) return setErr('Use letters, numbers, dot, dash or underscore.');
    if (versions.some((v) => v.name === n)) return setErr('That version already exists.');
    setErr(''); setAdding(true);
    try {
      const raw = newVersionJson(); // default JSON, enabled: false (it is the newest)
      const older = alsoOn ? sorted.filter((v) => v.valid_json && !v.enabled) : [];
      const added_at = new Date().toISOString();
      let shas;
      if (older.length) {
        const files = [{ path: n, content: raw }, ...older.map((v) => ({ path: v.name, content: withEnabled(v.raw, true) }))];
        ({ shas } = await api.commit(repo.name, files, `Add ${n}`));
        const upd = new Map(files.slice(1).map((f) => [f.path, f.content]));
        setVersions((vs) => [
          ...vs.map((v) => (upd.has(v.name) ? { ...v, raw: upd.get(v.name), sha: shas[v.name], enabled: true } : v)),
          { name: n, sha: shas[n], enabled: false, raw, valid_json: true, added_at },
        ]);
      } else {
        const { sha } = await api.saveFile(repo.name, n, raw, null);
        setVersions((vs) => [...vs, { name: n, sha, enabled: false, raw, valid_json: true, added_at }]);
      }
      saveDates(repo.name, { [n]: added_at });
      setName('');
      toast(older.length ? `${n} added · ${older.length} older on` : `${n} added`);
    } catch (e2) { setErr(e2.message); }
    setAdding(false);
  };

  const rawBase = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/`;
  const historyBase = `https://github.com/${repo.full_name}/commits/${repo.default_branch}/`;

  return (
    <>
      <div className="apphead">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon n="back" /></button>
        <div className="title">
          <h2 className="ellipsis">{repo.name}</h2>
          {versions && (
            <div className="chips">
              <span className="chip">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
              <span className="chip live">{live} on</span>
            </div>
          )}
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      {versions === null && (err
        ? <button className="btn ghost wide" onClick={load}>Try again</button>
        : <div className="list"><i className="sk" /><i className="sk" /></div>)}

      {versions && (
        <>
          {pending.length > 0 && (
            <button className="btn tonal wide" onClick={enableOlder} disabled={bulk}>
              <Icon n="power" s={16} /> {bulk ? 'Enabling…' : `Enable update on ${pending.length} older version${pending.length > 1 ? 's' : ''}`}
            </button>
          )}
          <div className="list">
            {sorted.slice(0, limit).map((v, i) => (
              <VersionRow key={v.name} v={v} i={i} rawBase={rawBase} historyBase={historyBase} onToggle={toggle} onSave={save} onDelete={remove} />
            ))}
            {!versions.length && <p className="muted center">No versions yet. Add one below.</p>}
          </div>
          {sorted.length > limit && (
            <button className="btn ghost wide" onClick={() => setLimit(limit + PAGE)}>Show more ({sorted.length - limit})</button>
          )}

          <form className="addbox" onSubmit={add}>
            <span className="lbl">New version</span>
            <div className="row">
              <input className="input mono" placeholder="e.g. 1.2.3.json" value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="none" autoCorrect="off" />
              <button className="btn" disabled={adding}>{adding ? '…' : 'Add'}</button>
            </div>
            <label className="check">
              <input type="checkbox" checked={alsoOn} onChange={(e) => setAlsoOn(e.target.checked)} />
              <span>Switch on update for older versions</span>
            </label>
          </form>
        </>
      )}
    </>
  );
}
