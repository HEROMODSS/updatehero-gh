import React, { useEffect, useState } from 'react';

const MODES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'amoled', label: 'AMOLED' },
];

const COLORS = [
  { id: 'blue', hex: '#3E82F7' },
  { id: 'green', hex: '#22C55E' },
  { id: 'red', hex: '#EF4444' },
  { id: 'purple', hex: '#A855F7' },
  { id: 'orange', hex: '#F97316' },
];

export default function ThemeSwitch() {
  const [mode, setMode] = useState(() => document.documentElement.getAttribute('data-mode') || 'dark');
  const [color, setColor] = useState(() => document.documentElement.getAttribute('data-color') || 'blue');

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('uh-mode', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', color);
    localStorage.setItem('uh-color', color);
  }, [color]);

  return (
    <div className="theme-picker">
      <div className="theme-picker-label">Appearance</div>
      <div className="mode-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="color-row">
        {COLORS.map((c) => (
          <span
            key={c.id}
            className={`color-swatch ${color === c.id ? 'active' : ''}`}
            style={{ background: c.hex }}
            onClick={() => setColor(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
