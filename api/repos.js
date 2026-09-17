import { checkAuth, unauthorized, gh } from './_lib.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const repos = await gh('/user/repos?per_page=100&sort=updated&affiliation=owner');
    const list = repos.map((r) => ({
      name: r.name,
      full_name: r.full_name,
      default_branch: r.default_branch,
      private: r.private,
      updated_at: r.updated_at,
    }));
    res.status(200).json({ repos: list });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
