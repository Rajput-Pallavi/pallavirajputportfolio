const skills: Record<string, [string, string[]]> = {
  Frontend: ['</>', ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS']],
  Backend: ['{ }', ['Java', 'Python', 'Node.js', 'Express.js']],
  Database: ['◉', ['SQL', 'MongoDB', 'Supabase']],
  'AI Engineering': ['✦', ['AI Agents', 'Machine Learning', 'Prompt Engineering', 'OpenAI API']],
  'Developer Tools': ['⌘', ['Git', 'GitHub', 'Codex']],
  'Creative Development': ['△', ['Three.js', 'Blender', 'Figma']],
}

export default function SkillsDetails({ category, isNight, onClose }: { category: string | null; isNight: boolean; onClose: () => void }) {
  if (!category || !skills[category]) return null
  const [symbol, items] = skills[category]
  return (
    <section className={`pointer-events-none absolute inset-x-0 bottom-[8%] z-30 px-6 text-center font-serif transition-colors duration-700 ${isNight ? 'text-[#fff8e7]' : 'text-slate-600'}`}>
      <button type="button" onClick={onClose} className="pointer-events-auto text-2xl" aria-label="Close skill details">×</button>
      <p className="mt-1 text-3xl" aria-hidden>{symbol}</p>
      <h2 className="mt-1 text-2xl sm:text-3xl">{category}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-8 sm:text-lg">{items.join('  ·  ')}</p>
    </section>
  )
}
