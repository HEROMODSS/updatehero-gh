import { guard, gh, owner, b64encode, sendError, okFile, validName, validJson } from './_lib.js';

// Single-file save / delete (1 GitHub call each).
export default async function handler(req, res) {
  if (!guard(req, res)) return;

  try {
    const { repo, path, content, sha } = req.body || {};
    if (!validName(repo) || !okFile(path)) {
      return res.status(400).json({ error: 'Invalid name. Use letters, numbers, dot, dash or underscore.' });
    }
    const url = `/repos/${owner()}/${repo}/contents/${encodeURIComponent(path)}`;

    if (req.method === 'PUT') {
      if (!validJson(content)) return res.status(400).json({ error: 'Content must be a JSON object (max 100 KB).' });
      const body = { message: sha ? `Update ${path}` : `Add ${path}`, content: b64encode(content) };
      if (sha) body.sha = String(sha);
      const result = await gh(url, { method: 'PUT', body: JSON.stringify(body) });
      return res.status(200).json({ sha: result.content.sha });
    }

    if (req.method === 'DELETE') {
      if (!sha) return res.status(400).json({ error: 'missing_params' });
      await gh(url, { method: 'DELETE', body: JSON.stringify({ message: `Delete ${path}`, sha: String(sha) }) });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    sendError(res, e);
  }
}
