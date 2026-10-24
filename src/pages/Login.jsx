import React, { useState } from 'react';
import { api } from '../api.js';

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
      <div className="brand"><img src="/logo.png" alt="" />UpdateHero</div>
      <form className="box col" onSubmit={submit}>
        <h2>Admin Panel</h2>
        <input className="input" type="password" placeholder="Password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="err" style={{ margin: 0 }}>{err}</div>}
        <button className="btn" disabled={loading}>{loading ? 'Checking…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
