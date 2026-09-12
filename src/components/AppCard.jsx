import React, { useMemo, useState } from 'react';
import VersionRow from './VersionRow.jsx';
import AndroidIcon from './AndroidIcon.jsx';
import { api } from '../api.js';
import { getDefaultTemplate } from '../defaultTemplate.js';

export default function AppCard({ repo, search }) {
  const [expanded, setExpanded] = useState(false);
  const [versions, setVersions] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const { versions } = await api.versions(repo.name);
      setVersions(versions);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && versions === null) load();
  };

  const sorted = useMemo(() => {
    const list = (versions || []).filter(
      (v) => !search || repo.name.toLowerCase().includes(search) || v.name.toLowerCase().includes(search)
    );
    const off = list.filter((v) => v.valid_json && !v.enabled).sort((a, b) => (a.name < b.name ? 1 : -1));
    const on = list
      .filter((v) => v.valid_json && v.enabled)
      .sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0));
    const invalid = list.filter((v) => !v.valid_json);
    return [...off, ...on, ...invalid];
  }, [versions, search, repo.name]);

  const visible = showAll ? sorted : sorted.slice(0, 2);
  const liveCount = (versions || []).filter((v) => v.enabled).length;

  const toggleVersion = async (version, enabled) => {
    setVersions((vs) => vs.map((v) => (v.path === version.path ? { ...v, enabled } : v)));
    try {
      const parsed = JSON.parse(version.raw);
      parsed.enabled = enabled;
      const newRaw = JSON.stringify(parsed, null, 2);
      const { sha } = await api.saveFile(repo.name, version.path, newRaw, version.sha);
      setVersions((vs) => vs.map((v) => (v.path === version.path ? { ...v, raw: newRaw, sha } : v)));
    } catch (e) {
      setErr(e.message);
      load();
    }
  };

  const saveRaw = async (version, content) => {
    const { sha } = await api.saveFile(repo.name, version.path, content, version.sha);
    let enabled = version.enabled;
    try { enabled = !!JSON.parse(content).enabled; } catch { /* ignore */ }
    setVersions((vs) =>
      vs.map((v) => (v.path === version.path ? { ...v, raw: content, sha, enabled, valid_json: true } : v))
    );
  };

  const deleteVersion = async (version) => {
    try {
      await api.deleteFile(repo.name, version.path, version.sha);
      setVersions((vs) => vs.filter((v) => v.path !== version.path));
    } catch (e) {
      setErr(e.message);
    }
  };

  const addVersion = async () => {
    const name = newName.trim();
    if (!name) { setErr('Enter a version name first.'); return; }
    setErr('');
    setAdding(true);
    try {
      await api.saveFile(repo.name, name, getDefaultTemplate(), null);
      setNewName('');
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card app-card">
      <div className="row-between" style={{ cursor: 'pointer' }} onClick={toggleExpand}>
        <div className="row">
          <div className="app-icon"><AndroidIcon /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{repo.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {versions ? `${versions.length} version${versions.length !== 1 ? 's' : ''} · ${liveCount} live` : repo.private ? 'private repo' : 'public repo'}
            </div>
          </div>
        </div>
        <span className="muted">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {loading && <p className="muted">Loading versions…</p>}
          {err && <div className="error-text">{err}</div>}

          {visible.map((v) => (
            <VersionRow
              key={v.path}
              version={v}
              repo={repo}
              branch={repo.default_branch}
              onToggle={toggleVersion}
              onSaveRaw={saveRaw}
              onDelete={deleteVersion}
            />
          ))}

          {sorted.length > 2 && (
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowAll((s) => !s)}>
              {showAll ? 'Show less' : `Show ${sorted.length - 2} more`}
            </button>
          )}

          <div className="row" style={{ marginTop: 14 }}>
            <input
              className="input mono"
              placeholder="e.g. 1.2.3 or 1.2.3.json"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVersion()}
            />
            <button className="btn btn-accent" onClick={addVersion} disabled={adding}>
              {adding ? 'Adding…' : 'Add version'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
