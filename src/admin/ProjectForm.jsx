import { useEffect, useRef, useState } from 'react'
import Thumb from '../components/Thumb'
import TagInput from './TagInput'
import { STATUS, slugify } from '../lib/projects'

const today = () => new Date().toISOString().slice(0, 10)

export const emptyProject = () => ({
  slug: '',
  title: '',
  tagline: '',
  description: '',
  url: '',
  repoUrl: '',
  thumbnail: '',
  gallery: [],
  tech: [],
  category: '',
  status: 'live',
  featured: false,
  hidden: false,
  createdAt: today(),
  updatedAt: today(),
})

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function validate(project, takenSlugs) {
  const errors = {}
  if (!project.title.trim()) errors.title = 'Title is required.'
  if (!project.slug) errors.slug = 'Slug is required.'
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.slug)) errors.slug = 'Use lowercase letters, numbers and dashes only.'
  else if (takenSlugs.includes(project.slug)) errors.slug = 'Another project already uses this slug.'
  if (project.url && !isHttpUrl(project.url)) errors.url = 'Enter a full URL starting with https://'
  if (project.repoUrl && !isHttpUrl(project.repoUrl)) errors.repoUrl = 'Enter a full URL starting with https://'
  return errors
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="m-0 text-xs text-hot">{error}</p>
      ) : (
        hint && <p className="m-0 text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

/**
 * Edits one project. Changes only reach the draft list when "Apply" is pressed;
 * nothing is sent to GitHub from here.
 */
export default function ProjectForm({ initial, isNew, takenSlugs, categories, imageSrc, onAddImage, onApply, onDismiss }) {
  const dialogRef = useRef(null)
  const [project, setProject] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
  }, [])

  const set = (patch) => setProject((current) => ({ ...current, ...patch }))

  const onTitle = (title) => set(slugTouched ? { title } : { title, slug: slugify(title) })

  const upload = async (files, target) => {
    if (files.length === 0) return
    if (!project.slug) {
      setUploadError('Enter a title first, so the images can be filed under the project slug.')
      return
    }
    setBusy(true)
    setUploadError('')
    try {
      const paths = []
      for (const file of files) paths.push(await onAddImage(file, project.slug))
      if (target === 'thumbnail') set({ thumbnail: paths[0] })
      else setProject((current) => ({ ...current, gallery: [...current.gallery, ...paths] }))
    } catch (error) {
      setUploadError(error.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const cleaned = {
      ...project,
      title: project.title.trim(),
      tagline: project.tagline.trim(),
      description: project.description.trim(),
      url: project.url.trim(),
      repoUrl: project.repoUrl.trim(),
      category: project.category.trim(),
    }
    const found = validate(cleaned, takenSlugs)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onApply({ ...cleaned, updatedAt: today() })
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => event.preventDefault()}
      onClose={onDismiss}
      aria-labelledby="project-form-title"
      className="m-0 ml-auto h-dvh max-h-none w-[min(40rem,100vw)] max-w-none border-0 border-l border-line bg-panel p-0 text-fg"
    >
      <form onSubmit={submit} noValidate className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id="project-form-title" className="m-0 text-lg font-semibold">
            {isNew ? 'New project' : `Edit ${initial.title}`}
          </h2>
          <button type="button" className="btn btn-sm" onClick={onDismiss}>
            Cancel
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <Field id="title" label="Title *" error={errors.title}>
            <input
              id="title"
              className="input"
              value={project.title}
              onChange={(event) => onTitle(event.target.value)}
              aria-invalid={Boolean(errors.title)}
              autoFocus
            />
          </Field>

          <Field id="slug" label="Slug *" hint="Short id used for the image folder." error={errors.slug}>
            <input
              id="slug"
              className="input font-mono"
              value={project.slug}
              onChange={(event) => {
                setSlugTouched(true)
                set({ slug: event.target.value.toLowerCase() })
              }}
              aria-invalid={Boolean(errors.slug)}
            />
          </Field>

          <Field id="tagline" label="Short description" hint="One line, shown on the card.">
            <input
              id="tagline"
              className="input"
              value={project.tagline}
              maxLength={160}
              onChange={(event) => set({ tagline: event.target.value })}
            />
          </Field>

          <Field id="description" label="Long description" hint="Shown in the detail view. Line breaks are kept.">
            <textarea
              id="description"
              className="input min-h-32 resize-y"
              value={project.description}
              onChange={(event) => set({ description: event.target.value })}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="url" label="Project URL" error={errors.url}>
              <input
                id="url"
                type="url"
                className="input"
                placeholder="https://name.relifes.net"
                value={project.url}
                onChange={(event) => set({ url: event.target.value })}
                aria-invalid={Boolean(errors.url)}
              />
            </Field>
            <Field id="repoUrl" label="Repository URL" error={errors.repoUrl}>
              <input
                id="repoUrl"
                type="url"
                className="input"
                placeholder="https://github.com/..."
                value={project.repoUrl}
                onChange={(event) => set({ repoUrl: event.target.value })}
                aria-invalid={Boolean(errors.repoUrl)}
              />
            </Field>
            <Field id="category" label="Category">
              <input
                id="category"
                className="input"
                list="category-options"
                value={project.category}
                onChange={(event) => set({ category: event.target.value })}
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </Field>
            <Field id="status" label="Status">
              <select
                id="status"
                className="input"
                value={project.status}
                onChange={(event) => set({ status: event.target.value })}
              >
                {Object.entries(STATUS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="tech" label="Tech stack" hint="Press Enter or comma to add a tag.">
            <TagInput id="tech" value={project.tech} onChange={(tech) => set({ tech })} placeholder="React, Tailwind CSS…" />
          </Field>

          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-neon"
                checked={project.featured}
                onChange={(event) => set({ featured: event.target.checked })}
              />
              Featured (wide card)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-neon"
                checked={project.hidden}
                onChange={(event) => set({ hidden: event.target.checked })}
              />
              Hidden from the public page
            </label>
          </div>

          <div className="field">
            <span className="label">Thumbnail</span>
            <div className="flex items-start gap-4">
              <div className="aspect-[16/10] w-44 shrink-0 overflow-hidden border border-line">
                <Thumb project={project} src={imageSrc(project.thumbnail)} />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="btn btn-sm">
                  {project.thumbnail ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={busy}
                    onChange={(event) => {
                      upload([...event.target.files], 'thumbnail')
                      event.target.value = ''
                    }}
                  />
                </label>
                {project.thumbnail && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => set({ thumbnail: '' })}>
                    Remove
                  </button>
                )}
                <p className="m-0 text-xs text-muted">Without one, generated artwork is shown.</p>
              </div>
            </div>
          </div>

          <div className="field">
            <span className="label">Gallery</span>
            <div className="grid grid-cols-3 gap-3">
              {project.gallery.map((path) => (
                <div key={path} className="group relative aspect-[16/10] overflow-hidden border border-line">
                  <img src={imageSrc(path)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => set({ gallery: project.gallery.filter((existing) => existing !== path) })}
                    className="btn btn-sm btn-danger absolute top-1 right-1 bg-ink/90"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="btn aspect-[16/10] border-dashed">
                {busy ? 'Processing…' : '+ Add images'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={busy}
                  onChange={(event) => {
                    upload([...event.target.files], 'gallery')
                    event.target.value = ''
                  }}
                />
              </label>
            </div>
            {uploadError && <p className="m-0 text-xs text-hot">{uploadError}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
          <p className="m-0 text-xs text-muted">Applies to your draft. Publish to make it live.</p>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Apply
          </button>
        </div>
      </form>
    </dialog>
  )
}
