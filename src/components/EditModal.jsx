import React, { useState } from 'react';
import ModalPortal from './ModalPortal.jsx';

export default function EditModal({ title, initialJson, onClose, onSave }) {
  const [text, setText] = useState(() => {
    try { return JSON.stringify(JSON.parse(initialJson), null, 2); } catch { return initialJson; }
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setErr('');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setErr('Not valid JSON — check for a missing comma or bracket.');
      return;
    }
    setSaving(true);
    try {
      await onSave(JSON.stringify(parsed, null, 2));
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <h3 className="heading" style={{ marginTop: 0 }}>{title}</h3>
          <textarea
            className="input mono"
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          {err && <div className="error-text" style={{ marginTop: 8 }}>{err}</div>}
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-accent" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save to GitHub'}</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
