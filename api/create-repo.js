import { checkAuth, unauthorized, gh } from './_lib.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { name } = req.body || {};
  if (!name || !/^[A-Za-z0-9._-]+$/.test(name)) {
    return res.status(400).json({ error: 'invalid_repo_name' });
  }

  try {
    const repo = await gh('/user/repos', {
      method: 'POST',
      body: JSON.stringify({ name, private: false, auto_init: true }),
    });
    res.status(200).json({
      name: repo.name,
      default_branch: repo.default_branch,
      private: repo.private,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
