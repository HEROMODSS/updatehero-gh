import { checkAuth, unauthorized, ghGraphQL, sendError, isVersionFile } from './_lib.js';

// ONE GraphQL call: every repo + its root file names (powers search and "new file" detection).
const QUERY = `
query($after: String) {
  viewer {
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        nameWithOwner
        pushedAt
        defaultBranchRef { name }
        object(expression: "HEAD:") { ... on Tree { entries { name type } } }
      }
    }
  }
}`;

export default async function handler(req, res) {
  if (!checkAuth(req)) return unauthorized(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const repos = [];
    let after = null;
    for (let page = 0; page < 5; page++) {
      const conn = (await ghGraphQL(QUERY, { after })).viewer.repositories;
      for (const r of conn.nodes) {
        repos.push({
          name: r.name,
          full_name: r.nameWithOwner,
          default_branch: (r.defaultBranchRef && r.defaultBranchRef.name) || 'main',
          updated_at: r.pushedAt,
          version_names: ((r.object && r.object.entries) || []).filter(isVersionFile).map((e) => e.name),
        });
      }
      if (!conn.pageInfo.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
    res.status(200).json({ repos });
  } catch (e) {
    sendError(res, e);
  }
}
