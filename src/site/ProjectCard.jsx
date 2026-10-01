import Thumb from '../components/Thumb'
import StatusBadge from '../components/StatusBadge'
import { assetUrl, hostOf } from '../lib/projects'

export default function ProjectCard({ project, onOpen }) {
  const tech = project.tech ?? []

  return (
    <article className={`frame frame-hover ${project.featured ? 'sm:col-span-2' : ''}`}>
      <div className="frame-body flex flex-col">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`View details for ${project.title}`}
          className="group flex flex-1 cursor-pointer flex-col border-0 bg-transparent p-0 text-left text-fg"
        >
          <div className={`relative w-full overflow-hidden ${project.featured ? 'aspect-[16/7]' : 'aspect-[16/10]'}`}>
            <Thumb
              project={project}
              src={assetUrl(project.thumbnail)}
              className="transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <StatusBadge status={project.status} />
              {project.featured && <span className="chip border-neon/40 bg-ink/80 text-neon">Featured</span>}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5">
            <div>
              {project.category && <p className="label mb-1">{project.category}</p>}
              <h3 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-neon">
                {project.title}
              </h3>
            </div>
            {project.tagline && <p className="text-sm leading-relaxed text-muted">{project.tagline}</p>}
            {tech.length > 0 && (
              <ul className="mt-auto flex list-none flex-wrap gap-1.5 p-0">
                {tech.slice(0, 5).map((name) => (
                  <li key={name} className="chip">
                    {name}
                  </li>
                ))}
                {tech.length > 5 && <li className="chip">+{tech.length - 5}</li>}
              </ul>
            )}
          </div>
        </button>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 font-mono text-xs">
          {project.url ? (
            <a href={project.url} target="_blank" rel="noreferrer" className="truncate text-neon no-underline hover:underline">
              {hostOf(project.url)} ↗
            </a>
          ) : (
            <span className="text-muted">No public link yet</span>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted no-underline hover:text-fg">
              Source ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
