import { DATA_PATH, PUBLIC_DIR, REPO } from '../config'

const API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`

export class GitHubError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(token, path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(API + path, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new GitHubError(0, 'Could not reach GitHub. Check your connection and try again.')
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new GitHubError(response.status, explain(response.status, detail?.message))
  }
  return response.status === 204 ? null : response.json()
}

function explain(status, message) {
  if (status === 401) return 'GitHub rejected the token. It may be mistyped, expired or revoked.'
  if (status === 403) return `The token is not allowed to do this. It needs "Contents: Read and write" on ${REPO.owner}/${REPO.name}.`
  if (status === 404) return `Repository ${REPO.owner}/${REPO.name} was not found, or the token cannot access it.`
  return message ? `GitHub error ${status}: ${message}` : `GitHub error ${status}.`
}

function decodeBase64Text(base64) {
  const bytes = Uint8Array.from(atob(base64.replace(/\s/g, '')), (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Confirms the token can reach the repository and that its owner may push to it.
export async function verifyToken(token) {
  const repo = await request(token, '')
  if (repo.permissions && !repo.permissions.push) {
    throw new GitHubError(403, explain(403))
  }
}

// Returns the project list as stored on the branch, plus the file's blob sha for conflict detection.
export async function loadProjects(token) {
  const file = await request(token, `/contents/${DATA_PATH}?ref=${REPO.branch}`)
  const data = JSON.parse(decodeBase64Text(file.content))
  return { projects: data.projects ?? [], sha: file.sha }
}

export const repoPath = (publicPath) => `${PUBLIC_DIR}/${publicPath.replace(/^\/+/, '')}`

// Image as committed on the branch; unlike the deployed site this is available right after publishing.
export const rawUrl = (publicPath) =>
  `https://raw.githubusercontent.com/${REPO.owner}/${REPO.name}/${REPO.branch}/${repoPath(publicPath)}`

/**
 * Writes the project list, new images and image removals as a single commit,
 * so one publish triggers exactly one deploy.
 *
 * uploads: [{ path, base64 }] and deletions: [path], both relative to the public folder.
 * Returns the new commit sha and the blob sha of the written project list.
 */
export async function publish(token, { projects, baseSha, uploads, deletions, message }) {
  const current = await request(token, `/contents/${DATA_PATH}?ref=${REPO.branch}`)
  if (current.sha !== baseSha) {
    throw new GitHubError(409, 'The project list changed on GitHub since you loaded it. Reload, then redo your edits.')
  }

  const ref = await request(token, `/git/ref/heads/${REPO.branch}`)
  const head = ref.object.sha
  const headCommit = await request(token, `/git/commits/${head}`)

  const content = JSON.stringify({ projects }, null, 2) + '\n'
  const entries = [{ path: DATA_PATH, mode: '100644', type: 'blob', content }]
  for (const upload of uploads) {
    const blob = await request(token, '/git/blobs', {
      method: 'POST',
      body: { content: upload.base64, encoding: 'base64' },
    })
    entries.push({ path: repoPath(upload.path), mode: '100644', type: 'blob', sha: blob.sha })
  }
  const removals = deletions.map((path) => ({ path: repoPath(path), mode: '100644', type: 'blob', sha: null }))

  const createTree = (tree) =>
    request(token, '/git/trees', { method: 'POST', body: { base_tree: headCommit.tree.sha, tree } })

  let tree
  try {
    tree = await createTree([...entries, ...removals])
  } catch (error) {
    // Removing a path that is not in the repository is rejected; leftovers are harmless, so publish without removals.
    if (removals.length === 0 || error.status !== 422) throw error
    tree = await createTree(entries)
  }

  const commit = await request(token, '/git/commits', {
    method: 'POST',
    body: { message, tree: tree.sha, parents: [head] },
  })
  await request(token, `/git/refs/heads/${REPO.branch}`, { method: 'PATCH', body: { sha: commit.sha } })
  return { commit: commit.sha, sha: await blobSha(content) }
}

// The sha git assigns to a file with this content, so the next publish can detect outside changes.
async function blobSha(text) {
  const body = new TextEncoder().encode(text)
  const header = new TextEncoder().encode(`blob ${body.length}\0`)
  const bytes = new Uint8Array(header.length + body.length)
  bytes.set(header)
  bytes.set(body, header.length)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
