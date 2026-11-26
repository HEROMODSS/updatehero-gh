import React, { useMemo, useState } from 'react';
import AppCard from './AppCard.jsx';
import Icon from './Icon.jsx';

// Every repo in the account, A–Z, with a quick filter. No GitHub calls.
export default function AllApps({ repos, loading, onOpen }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (repos || [])
      .filter((r) => !t || r.name.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [repos, q]);

  return (
    <>
      <div className="hero">
        <h1>All apps</h1>
        <small>{repos ? `${list.length} of ${repos.length}` : ' '}</small>
      </div>
      <div className="search">
        <Icon n="search" s={16} />
        <input className="input" placeholder="Filter apps…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <div className="list"><i className="sk" /><i className="sk" /><i className="sk" /></div>
      ) : (
        <div className="list">
          {list.map((r, i) => <AppCard key={r.name} repo={r} i={i} onOpen={onOpen} />)}
          {!list.length && <p className="muted center">No apps found.</p>}
        </div>
      )}
    </>
  );
}
