import React from 'react';

export default function Toggle({ on, onChange, disabled }) {
  return (
    <button
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => !disabled && onChange(!on)}
      role="switch"
      aria-checked={on}
      disabled={disabled}
    >
      <i />
    </button>
  );
}
