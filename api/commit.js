import { guard, ghGraphQL, owner, b64encode, blobSha, sendError, okFile, validName, validJson } from './_lib.js';

// Many file changes in ONE commit (2 GitHub calls total, however many files).
// Used to add a new version and switch older versions on together.
const HEAD = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) { defaultBranchRef { name target { oid } } }
}`;
const COMMIT = `mutation($input: CreateCommitOnBranchInput!) { createCommitOnBranch(input: $input) { commit { oid } } }`;

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { repo, files, message } = req.body || {};
  if (!validName(repo)) return res.status(400).json({ error: 'invalid_repo' });
  const list = Array.isArray(files) ? files : [];
  if (!list.length || list.length > 100) return res.status(400).json({ error: 'Nothing to save.' });
  for (const f of list) {
    if (!f || !okFile(f.path) || !validJson(f.content)) return res.status(400).json({ error: `Invalid file: ${f && f.path}` });
  }

  try {
    const { repository } = await ghGraphQL(HEAD, { owner: owner(), name: repo });
    const ref = repository && repository.defaultBranchRef;
    if (!ref) return res.status(409).json({ error: 'Repository has no commits yet.' });

    await ghGraphQL(COMMIT, {
      input: {
        branch: { repositoryNameWithOwner: `${owner()}/${repo}`, branchName: ref.name },
        message: { headline: String(message || 'Update versions').slice(0, 100) },
        expectedHeadOid: ref.target.oid,
        fileChanges: { additions: list.map((f) => ({ path: f.path, contents: b64encode(f.content) })) },
      },
    });
    const shas = {};
    for (const f of list) shas[f.path] = blobSha(f.content);
    res.status(200).json({ shas });
  } catch (e) {
    sendError(res, e);
  }
}
