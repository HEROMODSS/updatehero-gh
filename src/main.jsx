import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { getTheme, applyTheme } from './store.js';
import './styles/theme.css';

const sync = () => { const t = getTheme(); applyTheme(t.mode, t.color, t.style); };
sync(); // also sets the browser theme-color
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => getTheme().mode === 'auto' && sync());

// Pause the background smoke while scrolling so scrolling and taps stay smooth.
let timer = 0;
const cls = document.documentElement.classList;
addEventListener('scroll', () => {
  if (!cls.contains('scrolling')) cls.add('scrolling');
  clearTimeout(timer);
  timer = setTimeout(() => cls.remove('scrolling'), 150);
}, { passive: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <div className="smoke" aria-hidden="true"><i /><i /><i /></div>
    <App />
  </>
);
