import { checkAuth, unauthorized, ghGraphQL, owner, sendError, isVersionFile, validName } from './_lib.js';

// ONE GraphQL call per app: file contents + creation dates (only for files the browser has no date for).
export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { repo, want } = req.body || {};
  if (!validName(repo)) return res.status(400).json({ error: 'invalid_repo' });
  const names = (Array.isArray(want) ? want : []).filter(validName).slice(0, 100);

  // Creation date = oldest commit touching the file (history is newest-first).
  const hist = names
    .map((n, i) => `f${i}: history(path: ${JSON.stringify(n)}, first: 100) { nodes { committedDate } }`)
    .join(' ');
  const query = `query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      ${hist ? `defaultBranchRef { target { ... on Commit { ${hist} } } }` : ''}
      object(expression: "HEAD:") { ... on Tree { entries { name type object { ... on Blob { oid text isTruncated } } } } }
    }
  }`;

  try {
    const { repository: r } = await ghGraphQL(query, { owner: owner(), name: repo });
    const target = (r.defaultBranchRef && r.defaultBranchRef.target) || {};
    const dates = {};
    names.forEach((n, i) => {
      const nodes = (target[`f${i}`] && target[`f${i}`].nodes) || [];
      if (nodes.length) dates[n] = nodes[nodes.length - 1].committedDate;
    });

    const versions = ((r.object && r.object.entries) || []).filter(isVersionFile).map((f) => {
      const blob = f.object || {};
      const raw = blob.text || '';
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { /* invalid JSON */ }
      const valid = !!parsed && typeof parsed === 'object' && !blob.isTruncated;
      return {
        name: f.name,
        path: f.name,
        sha: blob.oid,
        enabled: valid ? !!parsed.enabled : null,
        raw,
        valid_json: valid,
        added_at: dates[f.name] || null,
      };
    });
    res.status(200).json({ versions });
  } catch (e) {
    sendError(res, e);
  }
}
