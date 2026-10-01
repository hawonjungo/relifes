import { hueOf } from '../lib/projects'

// Project image, or generated placeholder artwork when the project has none.
export default function Thumb({ project, src, contain = false, className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'} ${className}`}
      />
    )
  }

  const hue = hueOf(project.slug || project.title || 'x')
  const initials = (project.title || '?')
    .split(/\s+|(?=[A-Z])/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return (
    <div
      aria-hidden="true"
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 80% 14%), #06070b 60%, hsl(${(hue + 60) % 360} 80% 12%))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(${hue} 90% 60% / 0.18) 1px, transparent 1px), linear-gradient(to bottom, hsl(${hue} 90% 60% / 0.18) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <span
        className="relative font-mono text-4xl font-medium tracking-widest"
        style={{ color: `hsl(${hue} 95% 70%)`, textShadow: `0 0 24px hsl(${hue} 95% 60% / 0.6)` }}
      >
        {initials}
      </span>
    </div>
  )
}
