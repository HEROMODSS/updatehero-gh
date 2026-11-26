import React, { useEffect, useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { api, setUnauthorizedHandler } from './api.js';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(null); // null = still checking

  useEffect(() => {
    setUnauthorizedHandler(() => setLoggedIn(false));
    api.me()
      .then((d) => setLoggedIn(!!d.loggedIn))
      .catch(() => setLoggedIn(false));
  }, []);

  if (loggedIn === null) return null;
  return loggedIn ? (
    <Dashboard onLogout={() => setLoggedIn(false)} />
  ) : (
    <Login onSuccess={() => setLoggedIn(true)} />
  );
}
