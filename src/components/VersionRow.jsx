import React, { useState } from 'react';
import Toggle from './Toggle.jsx';
import EditModal from './EditModal.jsx';
import Icon from './Icon.jsx';
import { ago } from '../store.js';

export default function VersionRow({ v, rawBase, onToggle, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawBase + v.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="vrow">
      <div className="vname">
        <span className="mono ellipsis">
          {v.name}
          {!v.valid_json && <span className="warn" title="Invalid JSON"><Icon n="alert" s={13} /></span>}
        </span>
        <small>{ago(v.added_at)}</small>
      </div>
      {v.valid_json && <Toggle on={!!v.enabled} disabled={v.busy} onChange={(on) => onToggle(v, on)} />}
      <button className="icon-btn sm" title="Copy raw link" onClick={copy}><Icon n={copied ? 'check' : 'link'} /></button>
      <button className="icon-btn sm" title="Edit JSON" onClick={() => setEditing(true)}><Icon n="edit" /></button>
      <button className="icon-btn sm danger" title="Delete" onClick={() => confirm(`Delete ${v.name}?`) && onDelete(v)}><Icon n="trash" /></button>
      {editing && (
        <EditModal title={v.name} initialJson={v.raw || '{}'} saveLabel="Save to GitHub" onClose={() => setEditing(false)} onSave={(c) => onSave(v, c)} />
      )}
    </div>
  );
}
