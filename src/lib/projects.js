export const STATUS = {
  live: { label: 'Live', tone: 'ok' },
  wip: { label: 'In development', tone: 'warn' },
  archived: { label: 'Archived', tone: 'muted' },
}

export const isRemote = (path) => /^(https?:)?\/\//.test(path) || /^(data|blob):/.test(path)

// Resolves an image path stored in projects.json to a URL on the deployed site.
export function assetUrl(path) {
  if (!path) return ''
  if (isRemote(path)) return path
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '')
}

export function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Stable hue per project, used for generated placeholder artwork.
export function hueOf(text) {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.codePointAt(0)) % 360
  return hash
}

export function imagesOf(project) {
  return [project.thumbnail, ...(project.gallery ?? [])].filter(Boolean)
}
