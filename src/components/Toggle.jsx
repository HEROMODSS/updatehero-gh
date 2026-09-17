import React from 'react';

export default function Toggle({ on, onChange, disabled }) {
  return (
    <div className="toggle-wrap">
      <div
        className={`toggle ${on ? 'on' : ''}`}
        onClick={() => !disabled && onChange(!on)}
        role="switch"
        aria-checked={on}
      >
        <div className="thumb" />
      </div>
      <span className={`toggle-label ${on ? 'on' : ''}`}>{on ? 'Live' : 'Off'}</span>
    </div>
  );
}
