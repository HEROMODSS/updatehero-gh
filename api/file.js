import { checkAuth, unauthorized, gh, owner, b64encode } from './_lib.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);

  try {
    if (req.method === 'PUT') {
      // Create or update a version file.
      const { repo, path, content, sha } = req.body || {};
      if (!repo || !path || content === undefined) {
        return res.status(400).json({ error: 'missing_params' });
      }
      const body = {
        message: sha ? `Update ${path}` : `Add ${path}`,
        content: b64encode(content),
      };
      if (sha) body.sha = sha;

      const result = await gh(`/repos/${owner()}/${repo}/contents/${encodeURIComponent(path)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return res.status(200).json({ sha: result.content.sha });
    }

    if (req.method === 'DELETE') {
      const { repo, path, sha } = req.body || {};
      if (!repo || !path || !sha) return res.status(400).json({ error: 'missing_params' });

      await gh(`/repos/${owner()}/${repo}/contents/${encodeURIComponent(path)}`, {
        method: 'DELETE',
        body: JSON.stringify({ message: `Delete ${path}`, sha }),
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
