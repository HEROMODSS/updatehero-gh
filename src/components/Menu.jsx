import React, { useState, useRef, useEffect } from 'react';
import ThemeSwitch from './ThemeSwitch.jsx';
import EditModal from './EditModal.jsx';
import HiddenReposModal from './HiddenReposModal.jsx';
import { clearToken } from '../api.js';
import { getDefaultTemplate, setDefaultTemplate } from '../defaultTemplate.js';

export default function Menu({ onLogout, onHiddenChange }) {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [managingHidden, setManagingHidden] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const signOut = () => {
    setOpen(false);
    clearToken();
    onLogout();
  };

  const closeHiddenModal = () => {
    setManagingHidden(false);
    onHiddenChange && onHiddenChange();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
      {open && (
        <div className="menu-panel card glass" style={{ padding: 6 }}>
          <div className="menu-item" onClick={() => { setOpen(false); setEditingTemplate(true); }}>
            {'{ }'} Change JSON
          </div>
          <div className="menu-item" onClick={() => { setOpen(false); setManagingHidden(true); }}>
            🙈 Hidden apps
          </div>
          <ThemeSwitch />
          <div className="menu-item error-text" onClick={signOut}>⏻ Sign out</div>
        </div>
      )}

      {editingTemplate && (
        <EditModal
          title="Default version JSON"
          initialJson={getDefaultTemplate()}
          onClose={() => setEditingTemplate(false)}
          onSave={async (content) => setDefaultTemplate(content)}
        />
      )}

      {managingHidden && <HiddenReposModal onClose={closeHiddenModal} />}
    </div>
  );
}
