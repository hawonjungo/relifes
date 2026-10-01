import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Thumb from '../components/Thumb'
import StatusBadge from '../components/StatusBadge'
import ProjectForm, { emptyProject } from './ProjectForm'
import { loadProjects, publish, rawUrl, verifyToken } from './github'
import { blobToBase64, prepareImage } from './image'
import { REPO, SITE } from '../config'
import { hostOf, imagesOf, isRemote } from '../lib/projects'

const TOKEN_KEY = 'relifes.admin.token'
const REPO_URL = `https://github.com/${REPO.owner}/${REPO.name}`

const localImages = (project) => imagesOf(project).filter((path) => !isRemote(path))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// One-line commit message describing what changed between the published list and the draft.
function describeChanges(before, after) {
  const previous = new Map(before.map((project) => [project.slug, project]))
  const next = new Map(after.map((project) => [project.slug, project]))
  const names = (projects) => projects.map((project) => project.title).join(', ')

  const added = after.filter((project) => !previous.has(project.slug))
  const removed = before.filter((project) => !next.has(project.slug))
  const updated = after.filter((project) => previous.has(project.slug) && !same(previous.get(project.slug), project))

  const parts = []
  if (added.length > 0) parts.push(`add ${names(added)}`)
  if (updated.length > 0) parts.push(`update ${names(updated)}`)
  if (removed.length > 0) parts.push(`remove ${names(removed)}`)
  if (parts.length === 0) parts.push('reorder projects')
  return `content: ${parts.join('; ')}`
}

function SignIn({ onSubmit, busy, error }) {
  const [value, setValue] = useState('')
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <p className="label mb-3 text-neon">// {SITE.name} · admin</p>
      <h1 className="m-0 text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Paste a GitHub personal access token that can write to{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-neon">
          {REPO.owner}/{REPO.name}
        </a>
        . It is stored only in this browser and sent only to GitHub.
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (value.trim()) onSubmit(value.trim())
        }}
      >
        <div className="field">
          <label htmlFor="token" className="label">
            Access token
          </label>
          <input
            id="token"
            type="password"
            className="input font-mono"
            autoComplete="off"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={Boolean(error)}
            autoFocus
          />
          {error && <p className="m-0 text-xs text-hot">{error}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !value.trim()}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>

      <details className="mt-8 text-sm text-muted">
        <summary className="cursor-pointer text-fg">How to create the token</summary>
        <ol className="mt-3 flex flex-col gap-1.5 pl-5 leading-relaxed">
          <li>
            Open{' '}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
              className="text-neon"
            >
              GitHub → Settings → Fine-grained tokens
            </a>
            .
          </li>
          <li>
            Repository access: <em>Only select repositories</em> → <code>{REPO.name}</code>.
          </li>
          <li>
            Permissions → Repository → <em>Contents: Read and write</em>.
          </li>
          <li>Generate the token and paste it here.</li>
        </ol>
      </details>
    </main>
  )
}

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '')
  const [phase, setPhase] = useState(token ? 'loading' : 'signed-out')
  const [authError, setAuthError] = useState('')
  const [loaded, setLoaded] = useState({ projects: [], sha: '' })
  const [draft, setDraft] = useState([])
  const [pending, setPending] = useState({})
  const [editing, setEditing] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState(null)
  const started = useRef(false)

  const connect = useCallback(async (candidate) => {
    setPhase('loading')
    setAuthError('')
    try {
      await verifyToken(candidate)
      const fresh = await loadProjects(candidate)
      localStorage.setItem(TOKEN_KEY, candidate)
      setToken(candidate)
      setLoaded(fresh)
      setDraft(fresh.projects)
      setPhase('ready')
    } catch (error) {
      if (error.status === 401) localStorage.removeItem(TOKEN_KEY)
      setAuthError(error.message)
      setPhase('signed-out')
    }
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (token) connect(token)
  }, [token, connect])

  const dirty = phase === 'ready' && !same(draft, loaded.projects)

  useEffect(() => {
    if (!dirty) return
    const warn = (event) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const categories = useMemo(
    () => [...new Set(draft.map((project) => project.category).filter(Boolean))].sort(),
    [draft],
  )

  const imageSrc = (path) => {
    if (!path) return ''
    if (isRemote(path)) return path
    return pending[path]?.url ?? rawUrl(path)
  }

  const addImage = async (file, slug) => {
    const { blob, extension } = await prepareImage(file)
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const path = `projects/${slug}/${id}.${extension}`
    setPending((current) => ({ ...current, [path]: { blob, url: URL.createObjectURL(blob) } }))
    return path
  }

  const signOut = () => {
    if (dirty && !window.confirm('You have unpublished changes. Sign out and discard them?')) return
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setDraft([])
    setNotice(null)
    setPhase('signed-out')
  }

  const move = (index, delta) => {
    const next = [...draft]
    const [project] = next.splice(index, 1)
    next.splice(index + delta, 0, project)
    setDraft(next)
  }

  const remove = (index) => {
    if (!window.confirm(`Delete "${draft[index].title}"? This takes effect when you publish.`)) return
    setDraft(draft.filter((_, position) => position !== index))
  }

  const apply = (project) => {
    setDraft(editing.index === null ? [...draft, project] : draft.map((existing, index) => (index === editing.index ? project : existing)))
    setEditing(null)
  }

  const publishDraft = async () => {
    setPublishing(true)
    setNotice(null)
    try {
      const before = new Set(loaded.projects.flatMap(localImages))
      const after = new Set(draft.flatMap(localImages))
      const uploads = await Promise.all(
        [...after]
          .filter((path) => pending[path] && !before.has(path))
          .map(async (path) => ({ path, base64: await blobToBase64(pending[path].blob) })),
      )
      const deletions = [...before].filter((path) => !after.has(path))

      const result = await publish(token, {
        projects: draft,
        baseSha: loaded.sha,
        uploads,
        deletions,
        message: describeChanges(loaded.projects, draft),
      })
      setLoaded({ projects: draft, sha: result.sha })
      setNotice({ kind: 'ok', commit: result.commit })
    } catch (error) {
      setNotice({ kind: 'error', text: error.message })
    } finally {
      setPublishing(false)
    }
  }

  if (phase === 'loading' && token) {
    return <p className="flex min-h-screen items-center justify-center font-mono text-sm text-muted">// loading projects…</p>
  }

  if (phase !== 'ready') {
    return <SignIn onSubmit={connect} busy={phase === 'loading'} error={authError} />
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      <header className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink/90 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div>
          <p className="label m-0 text-neon">// admin</p>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-mono text-sm text-muted no-underline hover:text-fg">
            {REPO.owner}/{REPO.name} ↗
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={import.meta.env.BASE_URL} className="btn btn-sm">
            View site
          </a>
          <button type="button" className="btn btn-sm" onClick={signOut}>
            Sign out
          </button>
          <button type="button" className="btn btn-sm" disabled={!dirty || publishing} onClick={() => setDraft(loaded.projects)}>
            Discard
          </button>
          <button type="button" className="btn btn-primary" disabled={!dirty || publishing} onClick={publishDraft}>
            {publishing ? 'Publishing…' : dirty ? 'Publish changes' : 'Up to date'}
          </button>
        </div>
      </header>

      <div aria-live="polite">
        {notice?.kind === 'ok' && (
          <p className="mt-5 border border-ok/40 bg-ok/5 px-4 py-3 text-sm text-ok">
            Published as commit <code>{notice.commit.slice(0, 7)}</code>. The live site updates in 1–2 minutes.{' '}
            <a href={`${REPO_URL}/actions`} target="_blank" rel="noreferrer" className="text-ok underline">
              Watch the deploy ↗
            </a>
          </p>
        )}
        {notice?.kind === 'error' && (
          <p className="mt-5 border border-hot/40 bg-hot/5 px-4 py-3 text-sm text-hot">
            Publish failed. {notice.text} Your draft is still here.
          </p>
        )}
        {dirty && !publishing && (
          <p className="mt-5 border border-warn/40 bg-warn/5 px-4 py-3 text-sm text-warn">
            You have unpublished changes. They exist only in this tab until you publish.
          </p>
        )}
      </div>

      <div className="mt-8 mb-4 flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">
          Projects <span className="font-mono text-base text-muted">({draft.length})</span>
        </h1>
        <button type="button" className="btn" onClick={() => setEditing({ index: null, project: emptyProject() })}>
          + New project
        </button>
      </div>

      {draft.length === 0 ? (
        <p className="border border-dashed border-line py-16 text-center font-mono text-sm text-muted">
          // no projects yet — add the first one
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {draft.map((project, index) => (
            <li
              key={project.slug}
              className={`flex flex-wrap items-center gap-4 border border-line bg-panel p-3 ${project.hidden ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="btn btn-sm"
                  aria-label={`Move ${project.title} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  aria-label={`Move ${project.title} down`}
                  disabled={index === draft.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
              </div>

              <div className="aspect-[16/10] w-28 shrink-0 overflow-hidden border border-line">
                <Thumb project={project} src={imageSrc(project.thumbnail)} />
              </div>

              <div className="min-w-40 flex-1">
                <p className="m-0 font-semibold">{project.title}</p>
                <p className="m-0 truncate font-mono text-xs text-muted">
                  {project.url ? hostOf(project.url) : 'no link'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={project.status} />
                  {project.featured && <span className="chip border-neon/40 text-neon">Featured</span>}
                  {project.hidden && <span className="chip">Hidden</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn btn-sm" onClick={() => setEditing({ index, project })}>
                  Edit
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(index)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <ProjectForm
          key={editing.index ?? 'new'}
          initial={editing.project}
          isNew={editing.index === null}
          takenSlugs={draft.filter((_, index) => index !== editing.index).map((project) => project.slug)}
          categories={categories}
          imageSrc={imageSrc}
          onAddImage={addImage}
          onApply={apply}
          onDismiss={() => setEditing(null)}
        />
      )}
    </div>
  )
}
