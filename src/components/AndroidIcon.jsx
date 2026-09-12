import React from 'react';

export default function AndroidIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 9.5v5.2c0 .5.4.9.9.9h.6v3a1.4 1.4 0 0 0 2.8 0v-3h1.4v3a1.4 1.4 0 0 0 2.8 0v-3h.6c.5 0 .9-.4.9-.9V9.5H6Z"
        fill="var(--accent)"
      />
      <rect x="4.6" y="9.5" width="1.8" height="5.2" rx="0.9" fill="var(--accent)" />
      <rect x="17.6" y="9.5" width="1.8" height="5.2" rx="0.9" fill="var(--accent)" />
      <path
        d="M7 8.6a5 5 0 0 1 10 0H7Z"
        fill="var(--accent)"
      />
      <circle cx="9.3" cy="6.6" r="0.6" fill="var(--surface)" />
      <circle cx="14.7" cy="6.6" r="0.6" fill="var(--surface)" />
      <path d="M9 3.6 8 2.4M15 3.6l1-1.2" stroke="var(--accent)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}
