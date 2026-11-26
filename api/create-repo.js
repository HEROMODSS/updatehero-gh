import { guard, gh, owner, b64encode, sendError, validName, okFile, validJson } from './_lib.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Creates an empty public repo and commits its first version file straight away (2 GitHub calls).
// Nothing else is ever written: no README, no license, no instructions.
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { name, version, content } = req.body || {};
  if (!validName(name)) return res.status(400).json({ error: 'Invalid app name. Use letters, numbers, dot, dash or underscore.' });
  if (!okFile(version)) return res.status(400).json({ error: 'Invalid version name.' });
  if (!validJson(content)) return res.status(400).json({ error: 'Default JSON must be a valid JSON object.' });

  try {
    // Set GITHUB_OWNER_IS_ORG=1 if GITHUB_OWNER is an organization.
    const createUrl = process.env.GITHUB_OWNER_IS_ORG ? `/orgs/${owner()}/repos` : '/user/repos';
    let repo;
    try {
      repo = await gh(createUrl, { method: 'POST', body: JSON.stringify({ name, private: false, auto_init: false }) });
    } catch (e) {
      if (e.status === 422 && /already exists/i.test(e.message + JSON.stringify(e.errors || ''))) {
        return res.status(409).json({ error: 'An app with that name already exists.' });
      }
      if (e.status === 422) return res.status(400).json({ error: 'GitHub rejected that name.' });
      throw e;
    }
    if (owner() && repo.owner && repo.owner.login.toLowerCase() !== owner().toLowerCase()) {
      return res.status(500).json({ error: `Repo was created under ${repo.owner.login}, not ${owner()}. Check GITHUB_OWNER / token.` });
    }

    // A brand-new repo can take a moment before it accepts files, so retry briefly.
    let file = null;
    let warning = '';
    for (let i = 0; i < 4; i++) {
      try {
        file = await gh(`/repos/${repo.full_name}/contents/${encodeURIComponent(version)}`, {
          method: 'PUT',
          body: JSON.stringify({ message: `Add ${version}`, content: b64encode(content) }),
        });
        break;
      } catch (e) {
        if (i < 3 && (e.status === 404 || e.status === 409)) await sleep(700);
        else { warning = e.message; break; }
      }
    }

    res.status(200).json({
      name: repo.name,
      full_name: repo.full_name,
      default_branch: repo.default_branch || 'main',
      updated_at: new Date().toISOString(),
      version_names: file ? [version] : [],
      sha: file ? file.content.sha : null,
      warning,
    });
  } catch (e) {
    sendError(res, e);
  }
}
