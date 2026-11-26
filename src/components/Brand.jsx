import React from 'react';

// Logo + two-tone wordmark.
export default function Brand({ size = 28 }) {
  return (
    <span className="brand">
      <img src="/logo.png" alt="" width={size} height={size} />
      <span className="wm"><span>Update</span><b>Hero</b></span>
    </span>
  );
}
