# UpdateHero — GitHub Panel

A single-password admin dashboard that reads and writes your update-config
JSON files **directly inside your existing GitHub repos**. No database, no
Supabase — GitHub is the database, exactly like your current SnapTube-style
repos already work. Your dex files keep pointing at the same
`raw.githubusercontent.com` URLs; this panel just gives you a toggle instead
of editing JSON by hand.

## How it works

- Each GitHub repo = one app (e.g. `SnapTube`)
- Each file at the repo root = one version (e.g. `7.66.1.76602501`), containing
  your JSON config
- The panel lists your repos, lets you expand to see each version's file,
  flip `enabled` true/false with a toggle, edit the full JSON, add a new
  version file, or create a brand-new repo — all via the GitHub API
- Your dex still calls: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
  — nothing about that link changes

---

## 1. Create a GitHub Personal Access Token

1. GitHub → your profile picture → **Settings** → scroll down to **Developer settings**
2. **Personal access tokens → Tokens (classic)** → **Generate new token (classic)**
3. Check the **`repo`** scope (full control of private/public repos)
4. Generate, copy the token — you'll paste it into Vercel below

## 2. Push this project to GitHub

```bash
cd updatehero-gh
git init
git add .
git commit -m "UpdateHero GitHub panel"
git branch -M main
git remote add origin https://github.com/YOU/updatehero-gh.git
git push -u origin main
```

## 3. Deploy to Vercel (free)

1. **vercel.com** → New Project → import `updatehero-gh`
2. Framework preset: **Vite** (auto-detected)
3. Add Environment Variables:
   - `ADMIN_PASSWORD` — the password you'll type into the panel to log in
   - `GITHUB_TOKEN` — the token from step 1
   - `GITHUB_OWNER` — your GitHub username, e.g. `HEROMODSS`
4. Deploy. You'll get a live URL like `updatehero-gh.vercel.app`.

That's it — open the URL, enter your `ADMIN_PASSWORD`, and your repos show up.

---

## What's new in this version

- Terminal-style UI (JetBrains Mono everywhere), light-pink theme (dark mode still available, now pink-accented too)
- **Adding a version no longer prompts for JSON.** A fixed default template is used automatically — edit it any time via the ☰ menu → **Change JSON** (saved in your browser, applies to every future "Add version" on any repo)
- ☰ menu: Change JSON, dark/light theme, Sign out
- Repo icon is now an Android robot instead of a phone emoji
- **Hide/unhide repos**: eye icon on each app card hides it from the dashboard (stored in your browser only); a "Show N hidden apps" link brings them back
- Expanding a repo now lists **disabled (off) versions first**, then live ones, so you can see what still needs turning on at a glance

## Notes

- This panel controls **whatever repos the token's account owns**. Give the
  token only to yourself; anyone with `ADMIN_PASSWORD` can toggle/edit/delete
  files in those repos.
- Files without valid JSON are still listed (so you can see them) but the
  toggle is hidden until you fix the JSON via Edit.
- "Add version" creates a new file at the repo root with the name you type —
  match whatever naming convention your existing repos already use (with or
  without a `.json` extension, doesn't matter, since the dex just needs the
  raw URL).
