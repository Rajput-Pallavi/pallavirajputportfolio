import { ExternalLink, Mail } from 'lucide-react'

export default function ContactGreeting({ visible, isNight }: { visible: boolean; isNight: boolean }) {
  if (!visible) return null
  return <section className={`pointer-events-none absolute inset-x-0 bottom-[8%] z-30 px-6 text-center font-serif transition-colors duration-700 ${isNight ? 'text-[#fff8e7]' : 'text-slate-600'}`} aria-label="Contact Pallavi">
    <h1 className="text-3xl sm:text-5xl">Let's Connect</h1>
    <p className="mt-3 text-lg italic sm:text-xl">Have an idea? Let's bring it to life.</p>
    <div className="pointer-events-auto mt-6 flex justify-center gap-8 text-base">
      <a href="https://www.linkedin.com/in/pallavi-rajput-a304a027b/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline decoration-current/35 underline-offset-4"><ExternalLink className="h-5 w-5" aria-hidden />LinkedIn</a>
      <a href="mailto:rajputpallavi737@gmail.com" className="inline-flex items-center gap-2 underline decoration-current/35 underline-offset-4"><Mail className="h-5 w-5" aria-hidden />Email</a>
    </div>
  </section>
}
