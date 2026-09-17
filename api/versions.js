import { checkAuth, unauthorized, gh, owner, b64decode, IGNORED_FILES } from './_lib.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const { repo } = req.query;
  if (!repo) return res.status(400).json({ error: 'missing_repo' });

  try {
    const items = await gh(`/repos/${owner()}/${repo}/contents/`);
    const files = (Array.isArray(items) ? items : []).filter(
      (i) => i.type === 'file' && !IGNORED_FILES.has(i.name)
    );

    // Fetch each file's content + its most recent commit date in parallel.
    const versions = await Promise.all(
      files.map(async (f) => {
        let added_at = null;
        try {
          const commits = await gh(
            `/repos/${owner()}/${repo}/commits?path=${encodeURIComponent(f.path)}&per_page=1`
          );
          if (Array.isArray(commits) && commits[0]) {
            added_at = commits[0].commit?.committer?.date || commits[0].commit?.author?.date || null;
          }
        } catch { /* date is best-effort, ignore failures */ }

        try {
          const full = await gh(`/repos/${owner()}/${repo}/contents/${encodeURIComponent(f.path)}`);
          const raw = b64decode(full.content.replace(/\n/g, ''));
          let parsed = null;
          try { parsed = JSON.parse(raw); } catch { /* not valid JSON, still list it */ }
          return {
            name: f.name,
            path: f.path,
            sha: full.sha,
            enabled: parsed ? !!parsed.enabled : null,
            raw,
            valid_json: !!parsed,
            added_at,
          };
        } catch {
          return { name: f.name, path: f.path, sha: f.sha, enabled: null, raw: '', valid_json: false, added_at };
        }
      })
    );

    res.status(200).json({ versions });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
}
