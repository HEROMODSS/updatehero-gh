import { signSession, safeEqual, clientIp, COOKIE, SESSION_SECONDS, cookieAttrs } from '../_lib.js';

// Brute-force guard: 5 wrong passwords / 15 min / IP.
// Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (survives restarts),
// otherwise falls back to per-instance memory.
const WINDOW = 15 * 60;
const MAX = 5;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = new Map();

async function redis(cmds) {
  const r = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('redis');
  return (await r.json()).map((x) => x.result);
}
const useRedis = () => !!(REDIS_URL && REDIS_TOKEN);

// -> minutes left if locked, else 0
async function lockedFor(key) {
  if (useRedis()) {
    try {
      const [n, ttl] = await redis([['GET', key], ['TTL', key]]);
      return Number(n) >= MAX ? Math.ceil(Math.max(Number(ttl), 60) / 60) : 0;
    } catch { /* fall through to memory */ }
  }
  const rec = mem.get(key);
  const now = Date.now();
  return rec && now - rec.t < WINDOW * 1000 && rec.n >= MAX ? Math.ceil((WINDOW * 1000 - (now - rec.t)) / 60000) : 0;
}

async function recordFail(key) {
  if (useRedis()) {
    try { await redis([['INCR', key], ['EXPIRE', key, WINDOW, 'NX']]); return; } catch { /* fall through */ }
  }
  const now = Date.now();
  if (mem.size > 500) for (const [k, v] of mem) if (now - v.t > WINDOW * 1000) mem.delete(k);
  const rec = mem.get(key);
  mem.set(key, rec && now - rec.t < WINDOW * 1000 ? { n: rec.n + 1, t: rec.t } : { n: 1, t: now });
}

async function clear(key) {
  mem.delete(key);
  if (useRedis()) { try { await redis([['DEL', key]]); } catch { /* ignore */ } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const origin = req.headers.origin;
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'forbidden' }); }
    catch { return res.status(403).json({ error: 'forbidden' }); }
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server.' });

  const key = `uh:login:${clientIp(req)}`;
  const mins = await lockedFor(key);
  if (mins) return res.status(429).json({ error: `Too many attempts. Try again in ${mins} min.` });

  const { password } = req.body || {};
  if (typeof password !== 'string' || password.length > 200 || !safeEqual(password, expected)) {
    await recordFail(key);
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: 'invalid_password' });
  }

  await clear(key);
  const session = signSession({ u: 'admin', exp: Date.now() + SESSION_SECONDS * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE}=${session}; ${cookieAttrs}; Max-Age=${SESSION_SECONDS}`);
  res.status(200).json({ ok: true });
}
