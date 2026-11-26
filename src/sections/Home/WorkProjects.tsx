const projects = [
  ['Apex Global Motors', 'Luxury automobile export website.', '/demo/automobile', 'from-slate-400 to-slate-700'],
  ['Aurelia Estates', 'Premium real estate website.', '/demo/real-estate', 'from-amber-200 to-stone-500'],
  ['Nova Intelligence', 'AI automation and assistant demo.', '/demo/ai', 'from-[#171840] via-[#4c3789] to-[#11152d]'],
] as const

export default function WorkProjects({ visible, isNight }: { visible: boolean; isNight: boolean }) {
  if (!visible) return null
  return <section className={`absolute inset-x-0 bottom-[5%] z-30 mx-auto grid max-w-4xl gap-5 px-6 font-serif sm:grid-cols-3 ${isNight ? 'text-[#fff8e7]' : 'text-slate-700'}`} aria-label="Projects">
    {projects.map(([name, description, href, gradient]) => <article key={name} className="text-center">
      {href !== '/demo/ai' ? <img src={href === '/demo/automobile' ? '/apex/road.jpg' : '/aurelia/hero.jpg'} alt={href === '/demo/automobile' ? 'Silver Lamborghini Aventador' : 'Modern residence with a pool'} loading="lazy" className="mx-auto aspect-video w-full max-w-56 rounded-sm object-cover object-[center_70%]" /> : <div className={`mx-auto aspect-[16/9] w-full max-w-56 rounded-sm bg-gradient-to-br ${gradient} opacity-85`} role="img" aria-label={`${name} preview thumbnail`} />}
      <h2 className="mt-3 text-lg">{name}</h2><p className="mt-1 text-sm opacity-80">{description}</p>
      <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block underline decoration-current/40 underline-offset-4">View Website</a>
    </article>)}
  </section>
}
