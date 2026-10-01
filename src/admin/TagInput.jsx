import { useState } from 'react'

// Chip input: Enter or comma adds a tag, Backspace on an empty box removes the last one.
export default function TagInput({ id, value, onChange, placeholder }) {
  const [text, setText] = useState('')

  const add = (raw) => {
    const tags = raw
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag && !value.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
    if (tags.length > 0) onChange([...value, ...tags])
    setText('')
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      add(text)
    } else if (event.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="input flex flex-wrap items-center gap-1.5 focus-within:border-neon">
      {value.map((tag) => (
        <span key={tag} className="chip border-neon/40 text-neon">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((existing) => existing !== tag))}
            className="cursor-pointer border-0 bg-transparent p-0 text-neon hover:text-hot"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(text)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm text-fg outline-none"
      />
    </div>
  )
}
