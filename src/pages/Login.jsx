import React, { useState } from 'react';
import { api } from '../api.js';
import { BUILD } from '../store.js';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const d = await api.login(password);
      if (d.ok) return onSuccess();
      setErr(d.error === 'invalid_password' ? 'Wrong password.' : d.error || 'Login failed.');
    } catch {
      setErr('Something went wrong.');
    }
    setLoading(false);
  };

  return (
    <div className="login">
      <img className="logo" src="/logo.png" alt="" width="72" height="72" />
      <h1 className="wm xl"><span>Update</span><b>Hero</b></h1>
      <p className="muted">Sign in to manage your apps</p>
      <form className="box col" onSubmit={submit}>
        <input className="input" type="password" placeholder="Password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Checking…' : 'Sign in'}</button>
      </form>
      <small className="stamp">{BUILD}</small>
    </div>
  );
}
