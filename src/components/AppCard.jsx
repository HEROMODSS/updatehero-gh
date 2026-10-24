import React, { memo } from 'react';
import Icon, { AndroidIcon } from './Icon.jsx';
import { ago } from '../store.js';

const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// Compact list item used on Home, search results and All apps.
export default memo(function AppCard({ repo, isNew, hits, onOpen }) {
  const n = (repo.version_names || []).length;
  return (
    <button className="card" onClick={() => onOpen(repo.name)}>
      <span className="avatar" style={{ '--h': hue(repo.name) }}><AndroidIcon /></span>
      <span className="card-main">
        <span className="card-name">
          <span className="ellipsis">{repo.name}</span>
          {isNew && <b className="badge">NEW</b>}
        </span>
        <span className="card-meta">
          {hits && hits.length
            ? `v: ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ` +${hits.length - 3}` : ''}`
            : `${n} version${n !== 1 ? 's' : ''} · ${ago(repo.updated_at)}`}
        </span>
      </span>
      <span className="chev"><Icon n="chev" /></span>
    </button>
  );
});
