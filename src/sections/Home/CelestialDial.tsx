import { useEffect, useState, type ComponentType } from 'react'
import { Clock3, Moon, Sun, Sunrise, Sunset } from 'lucide-react'

type CelestialDialProps = {
  value: number | null
  onChange: (hour: number | null) => void
}

type Preset = { label: string; hour: number | null; Icon: ComponentType<{ size?: number }> ; position: string }

const presets: Preset[] = [
  { label: 'Sunrise', hour: 6, Icon: Sunrise, position: 'left-1 top-1/2 -translate-y-1/2' },
  { label: 'Noon', hour: 12, Icon: Sun, position: 'left-1/2 top-1 -translate-x-1/2' },
  { label: 'Sunset', hour: 18, Icon: Sunset, position: 'right-1 top-1/2 -translate-y-1/2' },
  { label: 'Night', hour: 22, Icon: Moon, position: 'bottom-2 right-8' },
  { label: 'Live', hour: null, Icon: Clock3, position: 'bottom-2 left-8' },
]

function getLocalHour() {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

export default function CelestialDial({ value, onChange }: CelestialDialProps) {
  const [liveHour, setLiveHour] = useState(getLocalHour)

  useEffect(() => {
    const timer = window.setInterval(() => setLiveHour(getLocalHour()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const hour = value ?? liveHour
  const isNight = hour < 6 || hour >= 19
  const label = `${String(Math.floor(hour) % 24).padStart(2, '0')}:${String(Math.round(hour % 1 * 60)).padStart(2, '0')}`

  return (
    <div className="absolute bottom-4 right-4 z-20 size-48 rounded-full border border-amber-200/55 bg-slate-950/45 text-white shadow-[0_0_32px_rgba(251,191,36,0.14)] backdrop-blur-md sm:bottom-5 sm:right-5 sm:size-52" role="group" aria-label="Celestial time controls">
      <div className="pointer-events-none absolute inset-3 rounded-full border border-amber-100/20" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34%] w-px origin-bottom bg-gradient-to-t from-amber-200/10 to-amber-200/80" style={{ transform: `translate(-50%, -100%) rotate(${hour / 24 * 360}deg)` }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-amber-200/40 bg-slate-950/65 shadow-inner">
        {isNight ? <Moon size={21} /> : <Sun size={22} />}
        <span className="-mt-3 text-sm font-medium tabular-nums text-amber-50">{label}</span>
      </div>
      {presets.map(({ label: presetLabel, hour: presetHour, Icon, position }) => {
        const selected = presetHour === null ? value === null : value === presetHour
        return (
          <button
            key={presetLabel}
            type="button"
            aria-pressed={selected}
            aria-label={presetHour === null ? 'Use live local time' : `Preview ${presetLabel}`}
            onClick={() => onChange(presetHour)}
            className={`absolute grid min-h-11 min-w-11 place-items-center rounded-full border text-amber-50 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${position} ${selected ? 'border-amber-200 bg-amber-300/20' : 'border-amber-100/25 bg-slate-900/60 hover:bg-amber-200/15'}`}
          >
            <Icon size={18} />
            <span className="sr-only">{presetLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
