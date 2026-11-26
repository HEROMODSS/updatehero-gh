import React, { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { getTheme, applyTheme, ACCENTS, BUILD } from '../store.js';

const STYLES = [['glass', 'Liquid Glass'], ['md3', 'Material 3']];
const MODES = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark'], ['amoled', 'AMOLED']];

export default function Settings({ onClose, onTemplate, onLogout }) {
  const [theme, setTheme] = useState(getTheme);
  const set = (patch) => {
    const next = { ...theme, ...patch };
    setTheme(next);
    applyTheme(next.mode, next.color, next.style);
  };

  return (
    <Modal sheet title="More" onClose={onClose}>
      <span className="lbl">Style</span>
      <div className="seg">
        {STYLES.map(([id, label]) => (
          <button key={id} className={theme.style === id ? 'on' : ''} onClick={() => set({ style: id })}>{label}</button>
        ))}
      </div>

      <span className="lbl">Appearance</span>
      <div className="seg">
        {MODES.map(([id, label]) => (
          <button key={id} className={theme.mode === id ? 'on' : ''} onClick={() => set({ mode: id })}>{label}</button>
        ))}
      </div>

      <span className="lbl">Accent</span>
      <div className="dots">
        {Object.entries(ACCENTS).map(([id, hex]) => (
          <button key={id} aria-label={id} className={theme.color === id ? 'on' : ''} style={{ background: hex }} onClick={() => set({ color: id })} />
        ))}
      </div>

      <button className="item" onClick={onTemplate}><Icon n="braces" />Default JSON<Icon n="chev" /></button>
      <button className="item danger" onClick={onLogout}><Icon n="logout" />Sign out</button>
      <small className="stamp">UpdateHero {BUILD}</small>
    </Modal>
  );
}
