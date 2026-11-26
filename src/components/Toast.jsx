import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function Toast() {
  const [t, setT] = useState(null);
  const timer = useRef(0);
  useEffect(() => {
    const on = (e) => {
      setT({ ...e.detail, id: Date.now() });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setT(null), 2400);
    };
    window.addEventListener('uh-toast', on);
    return () => { window.removeEventListener('uh-toast', on); clearTimeout(timer.current); };
  }, []);
  return t ? (
    <div className={`toast${t.bad ? ' bad' : ''}`} role="status" key={t.id}>
      <Icon n={t.bad ? 'alert' : 'check'} s={16} />{t.msg}
    </div>
  ) : null;
}
