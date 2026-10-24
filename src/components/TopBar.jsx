import React from 'react';
import Menu from './Menu.jsx';

export default function TopBar({ onLogout, onHiddenChange }) {
  return (
    <div className="top-bar glass">
      <div className="brand">
        <img src="/logo.png" alt="" className="brand-logo" />
        UpdateHero
      </div>
      <Menu onLogout={onLogout} onHiddenChange={onHiddenChange} />
    </div>
  );
}
