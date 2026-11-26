import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { flipTheme } from '../store.js';

// Hides the dock while scrolling down, shows it on scroll up. Toggles a class directly: no re-renders.
function useAutoHide(ref) {
  useEffect(() => {
    let last = window.scrollY, hidden = false, queued = false;
    const set = (h) => { if (h !== hidden) { hidden = h; ref.current && ref.current.classList.toggle('hide', h); } };
    const frame = () => {
      queued = false;
      const y = window.scrollY, d = y - last;
      if (y < 60 || d < -8) set(false);
      else if (d > 8) set(true);
      if (Math.abs(d) > 8) last = y;
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ref]);
}

const Tab = ({ on, label, icon, onClick, add }) => (
  <button className={`tab${on ? ' on' : ''}${add ? ' add' : ''}`} onClick={onClick} aria-label={label} title={label}>
    <Icon n={icon} s={add ? 22 : 20} />
    {on && <span>{label}</span>}
  </button>
);

// Round "island" dock: Home · Apps · New · Theme · More
export default function Dock({ active, onHome, onAll, onNew, onMore }) {
  const ref = useRef(null);
  useAutoHide(ref);
  const [mode, setMode] = useState(() => document.documentElement.dataset.mode);
  useEffect(() => {
    const sync = () => setMode(document.documentElement.dataset.mode);
    window.addEventListener('uh-theme', sync);
    return () => window.removeEventListener('uh-theme', sync);
  }, []);

  return (
    <nav className="dock" ref={ref}>
      <div className="bar">
        <Tab on={active === 'home'} label="Home" icon="home" onClick={onHome} />
        <Tab on={active === 'all'} label="Apps" icon="folder" onClick={onAll} />
        <Tab add label="New app" icon="plus" onClick={onNew} />
        <Tab label={mode === 'light' ? 'Dark mode' : 'Light mode'} icon={mode === 'light' ? 'moon' : 'sun'} onClick={flipTheme} />
        <Tab label="More" icon="sliders" onClick={onMore} />
      </div>
    </nav>
  );
}
