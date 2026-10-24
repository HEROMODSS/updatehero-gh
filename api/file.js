import { checkAuth, unauthorized, gh, owner, b64encode, sendError, IGNORED_FILES, validName } from './_lib.js';

const MAX_BYTES = 100_000;
const okFile = (n) => validName(n) && !IGNORED_FILES.has(n);

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);

  try {
    const { repo, path, content, sha } = req.body || {};
    if (!validName(repo) || !okFile(path)) {
      return res.status(400).json({ error: 'Invalid name. Use letters, numbers, dot, dash or underscore.' });
    }
    const url = `/repos/${owner()}/${repo}/contents/${encodeURIComponent(path)}`;

    if (req.method === 'PUT') {
      if (typeof content !== 'string' || content.length > MAX_BYTES) return res.status(400).json({ error: 'Content missing or too large.' });
      try {
        const p = JSON.parse(content);
        if (!p || typeof p !== 'object') throw new Error();
      } catch {
        return res.status(400).json({ error: 'Content must be a JSON object.' });
      }
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
