import { useEffect, useState } from 'react'

const destinations = [
  ['H', 'Home'], ['A', 'About Me'], ['S', 'Skills'],
  ['P', 'Pray'], ['W', 'My Work'], ['C', 'Contact'],
] as const

function visitDestination(index: number) {
  window.dispatchEvent(new CustomEvent('journey:navigate', { detail: index }))
}

export default function JourneyNavigation({ isNight }: { isNight: boolean }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const shortcuts = new Map(destinations.map(([key], index) => [key.toLowerCase(), index]))
    const navigate = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      const index = shortcuts.get(event.key.toLowerCase())
      if (index === undefined || event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()
      visitDestination(index)
    }
    const select = (event: Event) => setActive((event as CustomEvent<number>).detail)
    window.addEventListener('keydown', navigate)
    window.addEventListener('journey:navigate', select)
    window.addEventListener('journey:arrived', select)
    return () => {
      window.removeEventListener('keydown', navigate)
      window.removeEventListener('journey:navigate', select)
      window.removeEventListener('journey:arrived', select)
    }
  }, [])

  return (
    <nav aria-label="Portfolio journey" className={`absolute inset-x-0 top-0 z-30 flex flex-wrap items-center justify-center gap-x-7 gap-y-1 px-4 py-4 font-serif text-sm tracking-wide transition-colors duration-700 sm:text-base ${isNight ? 'text-[#fff8e7]' : 'text-slate-800'}`}>
      {destinations.map(([key, label], index) => (
        <button
          key={key}
          type="button"
          aria-keyshortcuts={key}
          aria-current={active === index ? 'page' : undefined}
          onClick={() => visitDestination(index)}
          className={`relative bg-transparent px-1 py-2 after:absolute after:bottom-1 after:left-0 after:h-px after:bg-current after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-1 focus-visible:outline-current ${active === index ? 'after:w-full' : 'after:w-0'}`}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
