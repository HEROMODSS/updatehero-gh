# UpdateHero — GitHub Panel

Admin panel for your update-config JSON files in GitHub. Each repo = one app, each root file = one version.

## Features
- **Home:** search + recently visited (apps you opened in this browser). Search is local, zero API calls.
- **Dock:** Home · Apps (A–Z) · New · Light/Dark · More (appearance, accent, Default JSON, sign out).
- **New app:** name + first version → creates the repo and commits the version (nothing else is written: no README or other files).
- **App page:** newest first. New versions are added switched **off**; tick *Switch on update for older versions* (or tap the button) to switch every older version **on** in a single commit.
- **Default JSON** (More menu): used for every new app and version. Each version can still be edited on its own.
- **Two styles (More → Style):** Liquid Glass (blur, smoke, rich motion) or Material 3 (flat, no blur, minimal motion). Saved per browser.
- Installable (add to home screen).

## GitHub API calls
| Action | Calls |
|---|---|
| Open the panel | 1 |
| Open an app | 0–1 |
| Create app | 2 |
| Toggle / edit / delete one version | 1 |
| Add version (+ switch older on) | 1 (2 when older versions are switched on) |
| Enable all older versions | 2, however many |

## Env vars (Vercel)
`ADMIN_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `SESSION_SECRET` (recommended). Optional: `GITHUB_OWNER_IS_ORG=1`, Upstash vars for a persistent login lock. See `.env.example`.

## Security
Login lock (5 tries / 15 min / IP, real client IP), signed `__Host-` cookie (7 days), same-origin check on writes, per-IP API rate limit, server-side name/size/JSON validation, only JSON version files can be touched, strict CSP.
