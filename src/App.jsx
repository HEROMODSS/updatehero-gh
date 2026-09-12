import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { getToken } from './api.js';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  return loggedIn ? <Dashboard onLogout={() => setLoggedIn(false)} /> : <Login onSuccess={() => setLoggedIn(true)} />;
}
