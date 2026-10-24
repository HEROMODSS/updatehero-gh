import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { getTheme, applyTheme } from './store.js';
import './styles/theme.css';

const sync = () => { const t = getTheme(); applyTheme(t.mode, t.color); };
sync(); // also sets the browser theme-color
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => getTheme().mode === 'auto' && sync());

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
