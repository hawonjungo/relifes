// The GitHub repository that stores this site and its content.
// The admin page reads and writes project data here through the GitHub API.
export const REPO = {
  owner: 'hawonjungo',
  name: 'relifes',
  branch: 'main',
}

// Project list, bundled into the site at build time.
export const DATA_PATH = 'src/data/projects.json'

// Uploaded images live under this folder and are served from the site root.
export const PUBLIC_DIR = 'public'

export const SITE = {
  name: 'relifes.net',
  owner: 'Jun Hoang',
  role: 'Developer',
  github: 'https://github.com/hawonjungo',
}
