import { useMemo, useState } from 'react'
import data from '../data/projects.json'
import { SITE } from '../config'
import ProjectCard from './ProjectCard'
import ProjectModal from './ProjectModal'

const projects = data.projects.filter((project) => !project.hidden)

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function FilterRow({ label, options, value, onChange }) {
  if (options.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label mr-1 w-20 shrink-0">{label}</span>
      <button type="button" className="chip" aria-pressed={value === null} onClick={() => onChange(null)}>
        All
      </button>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? null : option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [category, setCategory] = useState(null)
  const [tech, setTech] = useState(null)
  const [selected, setSelected] = useState(null)

  const categories = useMemo(() => uniqueSorted(projects.map((project) => project.category)), [])
  const techs = useMemo(() => uniqueSorted(projects.flatMap((project) => project.tech ?? [])), [])

  const visible = projects.filter(
    (project) =>
      (category === null || project.category === category) &&
      (tech === null || (project.tech ?? []).includes(tech)),
  )
  const liveCount = projects.filter((project) => project.status === 'live').length

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <a href="#top" className="font-mono text-sm tracking-widest text-fg no-underline">
          <span className="text-neon">re</span>lifes<span className="text-muted">.net</span>
        </a>
        <nav className="flex items-center gap-5 font-mono text-xs tracking-widest uppercase">
          <a href="#projects" className="text-muted transition-colors hover:text-neon">
            Projects
          </a>
          <a href={SITE.github} target="_blank" rel="noreferrer" className="text-muted transition-colors hover:text-neon">
            GitHub ↗
          </a>
        </nav>
      </header>

      <main id="top" className="flex-1">
        <section className="py-16 sm:py-24">
          <p className="label mb-5 text-neon">// {SITE.role} · project hub</p>
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Hi, I&rsquo;m {SITE.owner}.
            <br />
            <span className="text-muted">I build things and ship them here.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            {SITE.name} is the home base for my projects. Each one runs on its own sub-domain &mdash; pick one and
            jump in.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a href="#projects" className="btn btn-primary">
              Browse projects ↓
            </a>
            <dl className="flex gap-6 font-mono text-xs tracking-widest text-muted uppercase">
              <div className="flex items-baseline gap-2">
                <dd className="text-2xl text-fg">{String(projects.length).padStart(2, '0')}</dd>
                <dt>projects</dt>
              </div>
              <div className="flex items-baseline gap-2">
                <dd className="text-2xl text-ok">{String(liveCount).padStart(2, '0')}</dd>
                <dt>live</dt>
              </div>
            </dl>
          </div>
        </section>

        <section id="projects" className="scroll-mt-6 pb-24">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
            <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
            <span className="label">
              {visible.length} / {projects.length} shown
            </span>
          </div>

          <div className="mb-8 flex flex-col gap-3">
            <FilterRow label="Category" options={categories} value={category} onChange={setCategory} />
            <FilterRow label="Tech" options={techs} value={tech} onChange={setTech} />
          </div>

          {visible.length === 0 ? (
            <p className="py-16 text-center font-mono text-sm text-muted">// no projects match these filters</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((project) => (
                <ProjectCard key={project.slug} project={project} onOpen={() => setSelected(project)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-6 font-mono text-xs text-muted">
        <span>
          © {new Date().getFullYear()} {SITE.owner}
        </span>
        <span>{SITE.name}</span>
      </footer>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
