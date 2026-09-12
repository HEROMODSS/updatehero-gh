import React, { useEffect, useState } from 'react';

export default function ThemeSwitch({ compact }) {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uh-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  if (compact) {
    return (
      <div className="menu-item row" onClick={toggle}>
        <span>{theme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'}</span>
      </div>
    );
  }

  return (
    <button className="icon-btn" onClick={toggle} title="Toggle theme">
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
