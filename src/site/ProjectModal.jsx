import { useEffect, useRef, useState } from 'react'
import Thumb from '../components/Thumb'
import StatusBadge from '../components/StatusBadge'
import { assetUrl, imagesOf } from '../lib/projects'

export default function ProjectModal({ project, onClose }) {
  const dialogRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (project) {
      setActive(0)
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [project])

  const images = project ? imagesOf(project) : []

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-labelledby="project-modal-title"
      className="m-auto w-[min(56rem,calc(100vw-2rem))] max-w-none border border-line bg-panel p-0 text-fg"
    >
      {project && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
            <span className="label truncate">// {project.category || 'project'}</span>
            <button type="button" className="btn btn-sm" onClick={onClose}>
              Close ✕
            </button>
          </div>

          <div className="overflow-y-auto">
            <div className="aspect-video w-full bg-ink">
              <Thumb project={project} src={assetUrl(images[active])} contain />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-b border-line p-3">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={index === active}
                    className={`h-14 w-24 shrink-0 cursor-pointer border bg-ink p-0 ${
                      index === active ? 'border-neon' : 'border-line opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={assetUrl(image)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id="project-modal-title" className="text-3xl font-bold tracking-tight">
                  {project.title}
                </h2>
                <StatusBadge status={project.status} />
              </div>

              {project.tagline && <p className="text-lg text-muted">{project.tagline}</p>}
              {project.description && (
                <p className="leading-relaxed whitespace-pre-line text-fg/85">{project.description}</p>
              )}

              {(project.tech ?? []).length > 0 && (
                <ul className="flex list-none flex-wrap gap-1.5 p-0">
                  {project.tech.map((name) => (
                    <li key={name} className="chip">
                      {name}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {project.url && (
                  <a href={project.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Open project ↗
                  </a>
                )}
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn">
                    Source code ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
