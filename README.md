# relifes.net hub

Landing page for [relifes.net](https://relifes.net): a list of the projects that run on its sub-domains, plus a `/radmin/` page for adding, editing and removing projects from the browser.

There is no database. The project list is a JSON file in this repository, images are files in this repository, and GitHub Pages serves the result.

## How it works

- `src/data/projects.json` holds the project list. It is bundled into the site at build time.
- `public/projects/<slug>/` holds uploaded images.
- `/radmin/` signs in with a GitHub personal access token and writes changes to this repository through the GitHub API, as a single commit per publish.
- Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and deploys it to GitHub Pages. A published change is live in 1–2 minutes.

Security lives in GitHub: without a token that can write to this repository, nobody can change anything. The token is kept in the browser's local storage and sent only to `api.github.com`.

## Develop

```sh
npm install
npm run dev      # http://localhost:5173 and http://localhost:5173/radmin/
npm run build    # output in dist/
npm run preview  # serve dist/ locally
```

Stack: Vite, React, Tailwind CSS. No router; the public page and the admin page are two separate HTML entry points.

## First-time setup

1. Create the GitHub repository. Its owner and name must match `REPO` in `src/config.js`. It must be public (GitHub Pages on the free plan, and the admin previews images through `raw.githubusercontent.com`).
2. Push `main`.
3. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Create a fine-grained personal access token at <https://github.com/settings/personal-access-tokens/new>:
   - Repository access: only this repository
   - Repository permissions → Contents: **Read and write**
5. Open `/radmin/` on the deployed site and paste the token.

## Using the admin

Edits go into a draft that lives only in the open tab. **Publish changes** writes the whole draft to GitHub in one commit; **Discard** drops it.

- Order: use the arrows. The public page shows projects in list order.
- Featured: shown as a wide card.
- Hidden: kept in the list but not shown on the public page.
- Images are resized to at most 1600 px and converted to WebP in the browser before upload. GIF and SVG files are uploaded unchanged (3 MB limit).
- If the list was changed elsewhere after the admin loaded it, publishing is refused instead of overwriting; reload and redo the edits.

## Project fields

| Field | Notes |
| --- | --- |
| `slug` | Unique id, lowercase letters, numbers and dashes. Names the image folder. |
| `title` | Display name. |
| `tagline` | One line shown on the card. |
| `description` | Longer text shown in the detail view. Line breaks are kept. |
| `url` | Where the project runs. |
| `repoUrl` | Source repository, optional. |
| `thumbnail` | Image path relative to `public/`, or a full URL. Empty shows generated artwork. |
| `gallery` | List of image paths or URLs. |
| `tech` | List of technology tags; drives the Tech filter. |
| `category` | Free text; drives the Category filter. |
| `status` | `live`, `wip` or `archived`. |
| `featured`, `hidden` | Booleans. |
| `createdAt`, `updatedAt` | `YYYY-MM-DD`. |

## Custom domain

The workflow reads the Pages base path at build time, so the same build works at `https://<owner>.github.io/<repo>/` and at a custom domain without code changes. Set the custom domain under Settings → Pages; no `CNAME` file is needed with the GitHub Actions source.
