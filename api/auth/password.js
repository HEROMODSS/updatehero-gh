import { signSession, safeEqual, COOKIE, SESSION_SECONDS, cookieAttrs } from '../_lib.js';

// Best-effort brute-force guard (per server instance): 5 wrong passwords / 15 min / IP.
const fails = new Map();
const WINDOW = 15 * 60 * 1000;
const MAX = 5;

const clientIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'x';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'forbidden' }); } catch { return res.status(403).json({ error: 'forbidden' }); } }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server.' });

  const ip = clientIp(req);
  const now = Date.now();
  if (fails.size > 500) for (const [k, v] of fails) if (now - v.t > WINDOW) fails.delete(k);
  const rec = fails.get(ip);
  if (rec && now - rec.t < WINDOW && rec.n >= MAX) {
    const mins = Math.ceil((WINDOW - (now - rec.t)) / 60000);
    return res.status(429).json({ error: `Too many attempts. Try again in ${mins} min.` });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length > 200 || !safeEqual(password, expected)) {
    fails.set(ip, rec && now - rec.t < WINDOW ? { n: rec.n + 1, t: rec.t } : { n: 1, t: now });
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'invalid_password' });
  }

  fails.delete(ip);
  const session = signSession({ u: 'admin', exp: now + SESSION_SECONDS * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE}=${session}; ${cookieAttrs}; Max-Age=${SESSION_SECONDS}`);
  res.status(200).json({ ok: true });
}
