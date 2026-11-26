import { useEffect, useState } from 'react'

const pages = [
  ['01 — Who I Am', "Hi, I'm Pallavi Rajput, a passionate developer exploring full-stack development and AI engineering. I enjoy combining technology and creativity to build meaningful digital experiences."],
  ['02 — My Education', 'I completed my B.E. in Computer Science and Engineering at Jain Institute of Technology in 2025. My journey continues through learning, experimenting and building.'],
  ['03 — My Passion', 'I love creating beautiful, interactive websites that go beyond ordinary designs. For me, coding is a way to bring my imagination into the real world.'],
  ['04 — My Philosophy', 'Imagine it. Create it. Bring it to life.'],
] as const

export default function AboutDiary({ open, isNight, onClose }: { open: boolean; isNight: boolean; onClose: () => void }) {
  const [page, setPage] = useState(0)
  useEffect(() => { if (open) setPage(0) }, [open])
  if (!open) return null
  return (
    <section className="absolute inset-0 z-40 grid place-items-center p-4" aria-label="About Me diary">
      <div key={page} className={`relative w-full max-w-xl origin-left rounded-r-lg px-7 py-8 shadow-2xl [animation:diary-turn_.45s_ease-out] sm:px-12 sm:py-10 ${isNight ? 'bg-[#e8ddc5]/95 text-[#302b28]' : 'bg-[#f5ecd5]/95 text-[#473a2c]'}`}>
        <svg aria-hidden="true" viewBox="0 0 500 90" className="absolute inset-x-0 bottom-12 w-full opacity-15"><path d="M0 80 95 22l55 45 72-61 78 62 48-35 82 47 70-28v38H0Z" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
        <p className="relative text-2xl sm:text-3xl" style={{ fontFamily: 'Segoe Print, Bradley Hand, cursive' }}>{pages[page][0]}</p>
        <p className="relative mt-7 min-h-36 font-serif text-base leading-8 sm:text-lg">{pages[page][1]}</p>
        <div className="relative mt-8 flex items-center justify-between gap-3 font-serif text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-30">Previous</button>
          <span>{page + 1} / {pages.length}</span>
          {page < pages.length - 1 ? <button type="button" onClick={() => setPage((value) => value + 1)}>Next</button> : <button type="button" onClick={onClose}>Close</button>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close diary" className={`absolute right-3 top-2 text-xl ${isNight ? 'text-slate-700' : 'text-stone-600'}`}>×</button>
      </div>
    </section>
  )
}
