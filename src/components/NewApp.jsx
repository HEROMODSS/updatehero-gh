import React, { useState } from 'react';
import Modal from './Modal.jsx';

const OK = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

// Own state, so typing never re-renders the dashboard behind it.
export default function NewApp({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = name.trim(), v = version.trim();
    if (!OK.test(n)) return setErr('App name: letters, numbers, dot, dash or underscore.');
    if (!OK.test(v)) return setErr('Version: letters, numbers, dot, dash or underscore.');
    setErr(''); setBusy(true);
    try {
      await onCreate(n, v); // parent closes this modal on success
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New app" onClose={busy ? () => {} : onClose}>
      <form className="col" onSubmit={submit}>
        <label className="field"><span className="lbl">App name</span>
          <input className="input" placeholder="my-app" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} autoCapitalize="none" autoCorrect="off" />
        </label>
        <label className="field"><span className="lbl">First version</span>
          <input className="input mono" placeholder="1.0.0 or 1.0.0.json" value={version} onChange={(e) => setVersion(e.target.value)} disabled={busy} autoCapitalize="none" autoCorrect="off" />
        </label>
        <small>Creates a public GitHub repo and adds this version from your Default JSON.</small>
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create app'}</button>
      </form>
    </Modal>
  );
}
