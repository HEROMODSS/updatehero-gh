import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { getTheme, applyTheme } from '../store.js';

const MODES = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark'], ['amoled', 'AMOLED']];
const COLORS = { blue: '#2F6FED', green: '#16A34A', red: '#E5484D', purple: '#8B5CF6', orange: '#EA6A0A' };

export default function Menu({ onNew, onAll, onTemplate, onLogout }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const set = (patch) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next.mode, next.color);
  };
  const run = (fn) => () => { setOpen(false); fn(); };

  return (
    <div className="menu" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu" aria-haspopup="menu" aria-expanded={open}>
        <Icon n={open ? 'x' : 'menu'} s={20} />
      </button>
      {open && (
        <div className="menu-panel" role="menu">
          <button role="menuitem" onClick={run(onNew)}><Icon n="plus" />New app</button>
          <button role="menuitem" onClick={run(onAll)}><Icon n="folder" />All apps</button>
          <button role="menuitem" onClick={run(onTemplate)}><Icon n="braces" />Default JSON</button>

          <div className="sep" />
          <div className="theme">
            <span className="lbl">Appearance</span>
            <div className="seg">
              {MODES.map(([id, label]) => (
                <button key={id} className={theme.mode === id ? 'on' : ''} onClick={() => set({ mode: id })}>{label}</button>
              ))}
            </div>
            <span className="lbl">Accent</span>
            <div className="dots">
              {Object.entries(COLORS).map(([id, hex]) => (
                <button key={id} aria-label={id} className={theme.color === id ? 'on' : ''} style={{ background: hex }} onClick={() => set({ color: id })} />
              ))}
            </div>
          </div>
          <div className="sep" />

          <button role="menuitem" className="danger" onClick={run(onLogout)}><Icon n="logout" />Sign out</button>
        </div>
      )}
    </div>
  );
}
