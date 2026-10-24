import React, { useMemo, useState } from 'react';
import AppCard from './AppCard.jsx';
import Icon from './Icon.jsx';

// Every repo, A–Z, with a quick filter. No GitHub calls.
export default function AllApps({ repos, onBack, onOpen }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return repos
      .filter((r) => !t || r.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [repos, q]);

  return (
    <>
      <div className="row-between">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon n="back" /></button>
        <div className="title"><h2>All apps</h2><small>{list.length} of {repos.length}</small></div>
        <span className="icon-btn" />
      </div>
      <div className="search">
        <Icon n="search" s={16} />
        <input className="input" placeholder="Filter apps…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="list">
        {list.map((r) => <AppCard key={r.name} repo={r} onOpen={onOpen} />)}
        {!list.length && <p className="muted center">No apps found.</p>}
      </div>
    </>
  );
}
