import React, { useState } from 'react';
import Toggle from './Toggle.jsx';
import EditModal from './EditModal.jsx';

export default function VersionRow({ version, repo, branch, onToggle, onSaveRaw, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawUrl = `https://raw.githubusercontent.com/${repo.full_name || repo.name}/${branch}/${version.path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="version-row">
      <span className="mono version-name" title={version.name}>
        {version.name}{!version.valid_json && ' ⚠️'}
      </span>

      <div className="version-actions">
        {version.valid_json && <Toggle on={!!version.enabled} onChange={(v) => onToggle(version, v)} />}
        <button className="emoji-btn" title="Copy raw link" onClick={copy}>{copied ? '✅' : '🔗'}</button>
        <button className="emoji-btn" title="Edit JSON" onClick={() => setEditing(true)}>✏️</button>
        <button
          className="emoji-btn"
          title="Delete"
          onClick={() => { if (confirm(`Delete ${version.name}?`)) onDelete(version); }}
        >
          🗑️
        </button>
      </div>

      {editing && (
        <EditModal
          title={`Edit ${version.name}`}
          initialJson={version.raw || '{}'}
          onClose={() => setEditing(false)}
          onSave={(content) => onSaveRaw(version, content)}
        />
      )}
    </div>
  );
}
