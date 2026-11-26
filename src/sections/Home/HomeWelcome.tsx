export default function HomeWelcome({ visible, isNight }: { visible: boolean; isNight: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-[8%] z-10 px-6 text-center font-serif transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'} ${isNight ? 'text-[#fff8e7]' : 'text-slate-600'}`} aria-hidden={!visible}>
      <p className="text-lg italic tracking-[0.16em] sm:text-xl">Welcome to My World</p>
      <h1 className="mt-2 text-3xl tracking-wide sm:text-5xl">Pallavi Rajput</h1>
      <p className="mt-2 text-base tracking-[0.12em] sm:text-lg">Developer · Creator · Explorer</p>
      <p className="mt-3 text-base italic opacity-85 sm:text-lg">Learning, creating and growing with every step.</p>
    </div>
  )
}
