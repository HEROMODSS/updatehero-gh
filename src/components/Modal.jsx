import React, { useEffect } from 'react';
import Icon from './Icon.jsx';

// Centered dialog, or a bottom sheet when `sheet` is set.
export default function Modal({ title, onClose, sheet, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className={`overlay${sheet ? ' sheet' : ''}`} onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h3>{title}</h3>
          <button className="icon-btn sm" onClick={onClose} aria-label="Close"><Icon n="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
