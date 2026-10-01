# relifes.net — Project Brief

Handover notes: what was decided, what is built, and what is still open. See `README.md` for how the site works and how to run it.

## Goal

A hub at `relifes.net`: a landing page listing the projects that run on sub-domains, with a `/radmin/` page to add, edit and remove projects without rebuilding by hand.

## Decisions

- **Hosting:** GitHub Pages, deployed by GitHub Actions on every push to `main`.
- **Stack:** Vite + React + Tailwind CSS. Next.js was rejected: on static hosting its middleware, server actions and route handlers do not run.
- **Storage:** no database. Project data is `src/data/projects.json` and images are files under `public/projects/`, all in this repository. Supabase, Firebase and MongoDB Atlas were considered and rejected in favour of having no third-party service that can pause, change pricing or need a server.
- **Admin sign-in:** a GitHub fine-grained personal access token pasted into `/radmin/`. Only the owner uses the admin, so there is no Google login. Write protection is enforced by GitHub, not by the UI.
- **Accepted trade-off:** a published change is live after the deploy finishes, about 1–2 minutes, not instantly.
- **UI language:** English only. Everything in this repository and on GitHub (code, docs, commits, PRs) is English only.
- **Style:** light, minimal, modern, with a slight cyberpunk feel. No heavy 3D.
- **Old 3D portfolio:** code stays as it is; it moves to `portfolio.relifes.net`.
- **Repository `hawonjungo.github.io`:** left in place for now.

## State on 2026-10-01

Live at `https://relifes.net/` (admin at `https://relifes.net/radmin/`), deployed by the GitHub Actions workflow from `hawonjungo/relifes`. `www.relifes.net` redirects to `relifes.net`.

- Public page: hero, category and tech filters, project cards, detail dialog with gallery.
- Admin page: token sign-in, project list with reorder, add/edit/delete form, image upload, single-commit publish.

Not yet verified: publishing from the admin against the real GitHub API (needs an access token).

Seed data: five projects. Only ReSpeako and 3D Portfolio have descriptions; the rest have a title and URL only. URLs for ThreeElements and ContentFactory are placeholders that the owner will correct in the admin.

## Domain facts (checked 2026-10-01)

- `relifes.net` is the custom domain of this repository. The custom domain was removed from `hawonjungo/hawonjungo.github.io`, which now serves the old portfolio build at `hawonjungo.github.io`.
- `React-3D-Portfolio` deploys to its `gh-pages` branch and is reachable at `hawonjungo.github.io/React-3D-Portfolio/`.
- `respeako.relifes.net` and `anchoi.relifes.net` resolve and serve their sites.
- `portfolio.relifes.net`, `threeelements.relifes.net` and `contentfactory.relifes.net` have no DNS record.

## Remaining steps

1. Create the access token and test the admin end to end.
2. Fill in project descriptions, thumbnails and correct URLs through the admin.
3. Move the old portfolio to `portfolio.relifes.net`:
   1. Add a DNS `CNAME` record `portfolio` → `hawonjungo.github.io`.
   2. Set `portfolio.relifes.net` as the custom domain of `React-3D-Portfolio`, and add a `CNAME` file with that value to its `public/` folder so `gh-pages -d dist` keeps it.

Note: enable Pages (Settings → Pages → Source: GitHub Actions) before the first push of a repository that uses this workflow; otherwise the first run fails at `configure-pages` and nothing is deployed until the next push.