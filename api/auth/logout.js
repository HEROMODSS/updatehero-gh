import { COOKIE, cookieAttrs } from '../_lib.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs}; Max-Age=0`);
  res.status(200).json({ ok: true });
}
