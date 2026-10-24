import React, { useState } from 'react';
import Modal from './Modal.jsx';

export default function EditModal({ title, initialJson, saveLabel = 'Save', onClose, onSave }) {
  const [text, setText] = useState(() => {
    try { return JSON.stringify(JSON.parse(initialJson), null, 2); } catch { return initialJson; }
  });
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    let parsed;
    try { parsed = JSON.parse(text); } catch { setErr('Not valid JSON — check for a missing comma or bracket.'); return; }
    setSaving(true);
    try {
      await onSave(JSON.stringify(parsed, null, 2));
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <textarea className="input mono" rows={14} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      {err && <div className="err">{err}</div>}
      <div className="row end">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : saveLabel}</button>
      </div>
    </Modal>
  );
}
