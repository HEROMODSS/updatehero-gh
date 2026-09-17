import React, { useEffect, useMemo, useState } from 'react';
import ModalPortal from './ModalPortal.jsx';
import { api } from '../api.js';
import { getHiddenRepos, toggleHiddenRepo } from '../hiddenRepos.js';

export default function HiddenReposModal({ onClose }) {
  const [repos, setRepos] = useState(null);
  const [hidden, setHidden] = useState(getHiddenRepos());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { repos } = await api.repos();
        setRepos(repos);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const unhide = (name) => setHidden(toggleHiddenRepo(name));
  const hide = (name) => {
    setHidden(toggleHiddenRepo(name));
    setSearch('');
    setPickerOpen(false);
  };

  const hiddenRepoObjs = useMemo(
    () => (repos || []).filter((r) => hidden.includes(r.name)),
    [repos, hidden]
  );

  const pickable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (repos || [])
      .filter((r) => !hidden.includes(r.name))
      .filter((r) => !q || r.name.toLowerCase().includes(q));
  }, [repos, hidden, search]);

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <h3 className="heading" style={{ marginTop: 0 }}>Hidden apps</h3>
          <p className="muted" style={{ fontSize: 13, marginTop: -8 }}>
            Hidden apps stay off your dashboard but keep working — their links are untouched.
          </p>

          {err && <div className="error-text">{err}</div>}
          {repos === null && <p className="muted">Loading repos…</p>}

          <div className="col" style={{ gap: 8 }}>
            {hiddenRepoObjs.length === 0 && repos !== null && (
              <p className="muted" style={{ fontSize: 13 }}>Nothing hidden yet.</p>
            )}
            {hiddenRepoObjs.map((r) => (
              <div key={r.name} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="mono">{r.name}</span>
                <button className="btn btn-ghost" style={{ height: 32, padding: '0 10px' }} onClick={() => unhide(r.name)}>
                  unhide
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            {!pickerOpen ? (
              <button className="btn btn-accent" onClick={() => setPickerOpen(true)}>+ Hide an app</button>
            ) : (
              <div className="col">
                <input
                  className="input mono"
                  placeholder="Search repos…"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
                  {pickable.length === 0 ? (
                    <div className="muted" style={{ padding: 12, fontSize: 13 }}>No matches.</div>
                  ) : (
                    pickable.map((r) => (
                      <div
                        key={r.name}
                        className="menu-item mono"
                        onClick={() => hide(r.name)}
                      >
                        {r.name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
