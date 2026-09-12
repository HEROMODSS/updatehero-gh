import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import AppCard from '../components/AppCard.jsx';
import { api } from '../api.js';
import { getHiddenRepos } from '../hiddenRepos.js';

export default function Dashboard({ onLogout }) {
  const [repos, setRepos] = useState(null);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [creating, setCreating] = useState(false);
  const [hidden, setHidden] = useState(getHiddenRepos());

  const load = async () => {
    try {
      const { repos } = await api.repos();
      setRepos(repos);
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const createApp = async (e) => {
    e.preventDefault();
    const name = newRepoName.trim();
    if (!name) return;
    setErr('');
    setCreating(true);
    try {
      await api.createRepo(name);
      setNewRepoName('');
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  };

  const q = search.trim().toLowerCase();
  const visibleRepos = useMemo(
    () => (repos || []).filter((r) => !hidden.includes(r.name) && (!q || r.name.toLowerCase().includes(q))),
    [repos, hidden, q]
  );

  return (
    <div>
      <TopBar onLogout={onLogout} onHiddenChange={() => setHidden(getHiddenRepos())} />
      <div className="container">
        <h1 className="heading" style={{ fontSize: 22, marginBottom: 20 }}>Dashboard</h1>

        <div className="card">
          <h3 className="heading" style={{ marginTop: 0, fontSize: 15 }}>Create new app (GitHub repo)</h3>
          <form className="row" onSubmit={createApp}>
            <input className="input" placeholder="Enter App Name here" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} />
            <button className="btn btn-accent" type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</button>
          </form>
          {err && <div className="error-text" style={{ marginTop: 8 }}>{err}</div>}
        </div>

        <input
          className="input"
          placeholder="Search apps or versions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {repos === null ? (
          <p className="muted">Loading repos…</p>
        ) : visibleRepos.length === 0 ? (
          <p className="muted">No apps found.</p>
        ) : (
          visibleRepos.map((repo) => <AppCard key={repo.name} repo={repo} search={q} />)
        )}

        <div className="footer">Made with ❤️ by Hero</div>
      </div>
    </div>
  );
}
