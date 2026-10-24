import { checkAuth, unauthorized, gh, sendError, validName } from './_lib.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { name } = req.body || {};
  if (!validName(name)) return res.status(400).json({ error: 'Invalid name. Use letters, numbers, dot, dash or underscore.' });

  try {
    const r = await gh('/user/repos', { method: 'POST', body: JSON.stringify({ name, private: false, auto_init: true }) });
    res.status(200).json({
      name: r.name,
      full_name: r.full_name,
      default_branch: r.default_branch,
      updated_at: r.pushed_at || r.created_at,
      version_names: [],
    });
  } catch (e) {
    sendError(res, e);
  }
}
