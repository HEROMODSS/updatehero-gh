import React, { memo, useEffect, useRef, useState } from 'react';
import Toggle from './Toggle.jsx';
import EditModal from './EditModal.jsx';
import Icon from './Icon.jsx';
import { ago, toast } from '../store.js';

export default memo(function VersionRow({ v, i, rawBase, historyBase, onToggle, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sure, setSure] = useState(false); // second tap confirms delete
  const box = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const away = (e) => { if (!box.current || !box.current.contains(e.target)) { setMenu(false); setSure(false); } };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [menu]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(rawBase + v.name); toast('Link copied'); }
    catch { toast('Copy blocked by browser', true); }
  };

  return (
    <div className={`vrow${menu ? ' open' : ''}`} style={{ '--i': Math.min(i, 10) }}>
      <div className="vname">
        <span className="mono ellipsis">
          {v.name}
          {!v.valid_json && <span className="warn" title="Invalid JSON"><Icon n="alert" s={13} /></span>}
        </span>
        <small>{ago(v.added_at)}</small>
      </div>
      {v.valid_json && <Toggle on={v.enabled} disabled={v.busy} onChange={(on) => onToggle(v, on)} />}
      <button className="icon-btn sm" title="Copy raw link" aria-label="Copy raw link" onClick={copy}><Icon n="link" /></button>
      <div className="menu-wrap" ref={box}>
        <button className="icon-btn sm" aria-label="More" aria-expanded={menu} onClick={() => { setMenu(!menu); setSure(false); }}><Icon n="dots" /></button>
        {menu && (
          <div className="menu" role="menu">
            <button role="menuitem" onClick={() => { setMenu(false); setEditing(true); }}><Icon n="edit" s={16} />Edit JSON</button>
            <a role="menuitem" href={historyBase + encodeURIComponent(v.name)} target="_blank" rel="noopener noreferrer" onClick={() => setMenu(false)}><Icon n="history" s={16} />History</a>
            <button role="menuitem" className="danger" onClick={() => (sure ? onDelete(v) : setSure(true))}>
              <Icon n="trash" s={16} />{sure ? 'Tap to confirm' : 'Delete'}
            </button>
          </div>
        )}
      </div>
      {editing && (
        <EditModal title={v.name} initialJson={v.raw || '{}'} saveLabel="Save to GitHub" onClose={() => setEditing(false)} onSave={(c) => onSave(v, c)} />
      )}
    </div>
  );
});
