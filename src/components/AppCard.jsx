import React, { memo } from 'react';
import Icon, { AndroidIcon } from './Icon.jsx';
import { toneOf } from '../store.js';

// Compact list item used on Home, search results and All apps. The icon colour comes from the app's name.
export default memo(function AppCard({ repo, hits, i = 0, onOpen }) {
  const n = repo.version_names.length;
  return (
    <button className="card" style={{ '--i': Math.min(i, 10) }} onClick={() => onOpen(repo.name)}>
      <span className={`tile t${toneOf(repo.name)}`}><AndroidIcon /></span>
      <span className="card-main">
        <span className="card-name ellipsis">{repo.name}</span>
        <span className="card-meta">
          {hits && hits.length
            ? `v: ${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ` +${hits.length - 3}` : ''}`
            : `${n} version${n !== 1 ? 's' : ''}`}
        </span>
      </span>
      <span className="chev"><Icon n="chev" /></span>
    </button>
  );
});
