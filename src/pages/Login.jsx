import React, { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const data = await api.login(password);
      if (data.ok) {
        setToken(password);
        onSuccess();
      } else {
        setErr('Wrong password.');
      }
    } catch {
      setErr('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: 80 }}>
      <div className="brand" style={{ marginBottom: 30, justifyContent: 'center' }}>
        <img src="/logo.png" alt="" className="brand-logo" style={{ width: 32, height: 32 }} />
        UpdateHero
      </div>
      <div className="card">
        <h2 className="heading" style={{ marginTop: 0, textAlign: 'center' }}>Admin Panel</h2>
        <form className="col" onSubmit={submit}>
          <input
            className="input"
            type="password"
            placeholder="Password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="error-text">{err}</div>}
          <button className="btn btn-accent" type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
      <div className="footer">Made with ❤️ by Hero</div>
    </div>
  );
}
