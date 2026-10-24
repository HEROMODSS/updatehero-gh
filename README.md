# UpdateHero — GitHub Panel

Admin panel that reads/writes your update-config JSON files inside GitHub repos.
Each repo = one app, each root file = one version.

## Features
- **Home:** search + Recently visited (10 at a time). Apps that gain a new version file get a NEW badge and move to the top.
- **Search:** local, zero API calls. Multi-word; matches app names and version files.
- **Menu:** New app · All apps (A–Z) · Default JSON · Appearance (Auto/Light/Dark/AMOLED + accent) · Sign out.
- Versions sorted by creation date, newest first. No auto-refresh.

## GitHub API usage (minimum)
| Action | Calls |
|---|---|
| Open panel (list cached 10 min) | 0–1 |
| 🔄 refresh | 1 |
| Open an app (cached 3 min) | 0–1 |
| Toggle / edit / add / delete | 1 each |

## Security
- Password login: 5 wrong tries → 15 min lock (per server instance), constant-time compare.
- Session: signed `__Host-` cookie, HttpOnly, Secure, SameSite=Strict, 7 days. Changing the password or `SESSION_SECRET` logs everyone out.
- CSRF: write requests must come from the panel's own origin.
- Server validates repo/file names (no `..`, no slashes), file size (≤100 KB) and that content is a JSON object.
- Headers: strict CSP (no inline scripts), HSTS, no framing, no-store on `/api`.
- Tips: use a long random `ADMIN_PASSWORD`, set `SESSION_SECRET`, and prefer a fine-grained GitHub token limited to your repos (Contents: read/write, Administration: write only if you create apps here).

## Env vars (Vercel)
`ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `SESSION_SECRET` (recommended).
