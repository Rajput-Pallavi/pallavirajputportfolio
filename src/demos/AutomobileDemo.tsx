import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './AutomobileDemo.css'

const cars = [
  {
    id: 'road', name: 'Aventador Grigio', type: 'Supercar', finish: 'Silver',
    alt: 'Silver Lamborghini Aventador on a South African coastal road',
    description: 'A silver finish that emphasizes the angular Lamborghini bodywork. Sample sourcing includes a condition report and independent inspection.',
    credit: 'Stephan Louis', source: 'https://unsplash.com/photos/ulI87xZjL9U',
  },
  {
    id: 'noir', name: 'Aventador Nero', type: 'Collector', finish: 'Black',
    alt: 'Black Lamborghini Aventador parked in Newport Beach',
    description: 'A discreet finish for a collection. Sample sourcing focuses on service records, ownership history and confirmation of original equipment.',
    credit: 'Ariel Blanco', source: 'https://unsplash.com/photos/OpmLXbtjpq4',
  },
  {
    id: 'giallo', name: 'Aventador Giallo', type: 'Supercar', finish: 'Yellow',
    alt: 'Close-up of a yellow Lamborghini Aventador',
    description: 'A bright, unmistakably Lamborghini finish. Sample sourcing includes detailed paint photography and a review of transport options for your destination.',
    credit: 'Alex Suprun', source: 'https://unsplash.com/photos/qhLhjne8cPA',
  },
] as const

const filters = ['All', 'Supercar', 'Collector'] as const
const steps = [
  ['Consultation & sourcing', 'Share your preferred vehicle, budget and destination. We would use these to define a search and review import eligibility.'],
  ['Inspection & purchase', 'Review the condition report and ownership documents before approving the vehicle and purchase terms.'],
  ['Documentation & customs', 'Prepare the export paperwork and coordinate with the destination customs broker.'],
  ['Ocean freight & delivery', 'Arrange enclosed pickup and container shipping, with marine insurance options and delivery after clearance.'],
]
const carImage = (id: typeof cars[number]['id']) => '/apex/' + id + '.jpg'

export default function AutomobileDemo() {
  const stage = useRef<HTMLElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [filter, setFilter] = useState<typeof filters[number]>('All')
  const [selected, setSelected] = useState<typeof cars[number]>(cars[0])
  const [vehicle, setVehicle] = useState('')
  const [preview, setPreview] = useState<{ name: string; vehicle: string; destination: string } | null>(null)

  useLayoutEffect(() => {
    const previousTitle = document.title
    document.title = 'Apex Global Motors | Vehicle Sourcing & Export'
    gsap.registerPlugin(ScrollTrigger)
    const media = gsap.matchMedia(stage)
    media.add({
      desktop: '(min-width: 761px)',
      mobile: '(max-width: 760px)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    }, ({ conditions }) => {
      if (conditions?.reduceMotion) return
      const distance = conditions?.desktop ? 52 : 20
      gsap.timeline({
        scrollTrigger: { trigger: stage.current, start: 'top top', end: 'bottom bottom', scrub: 0.35 },
        defaults: { ease: 'none' },
      })
        .to('.apex-car', { xPercent: -distance, scale: 0.96 })
        .to('.apex-car', { xPercent: distance, scale: 0.96 })
    })
    return () => {
      media.revert()
      document.title = previousTitle
    }
  }, [])

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setPreview({
      name: String(values.get('name')).trim(),
      vehicle: String(values.get('vehicle')).trim(),
      destination: String(values.get('destination')).trim(),
    })
  }

  const shown = filter === 'All' ? cars : cars.filter((car) => car.type === filter)

  return (
    <main className="apex-site" id="apex-top">
      <nav className="apex-nav" aria-label="Apex Global Motors">
        <a href="#apex-top" className="apex-brand">Apex <span>Global Motors</span></a>
        <span className="apex-concept">Concept website</span>
        <a className="apex-back" href="/">← Back to Portfolio</a>
      </nav>

      <section ref={stage} className="apex-stage" aria-label="Vehicle export and shipping services">
        <div className="apex-stage-visual">
          <img className="apex-car" src={carImage('road')} alt={cars[0].alt} fetchPriority="high" />
        </div>
        <div className="apex-panels">
          <section className="apex-panel apex-hero" aria-labelledby="apex-title">
            <div>
              <p className="apex-kicker">International vehicle sourcing & export</p>
              <h1 id="apex-title">Engineered desire.<br />Delivered worldwide.</h1>
            </div>
            <div className="apex-hero-actions">
              <a href="#apex-collection" className="apex-button">Explore the collection</a>
              <a href="#apex-quote" className="apex-text-link">Request a quotation ↗</a>
            </div>
          </section>
          <section className="apex-panel apex-panel-right" aria-labelledby="apex-sourcing">
            <div className="apex-panel-copy">
              <p className="apex-kicker">Vehicle sourcing</p>
              <h2 id="apex-sourcing">Exceptional cars, personally sourced.</h2>
              <p>We help buyers identify the right specification through specialist dealers and private collections. Independent inspection and ownership checks inform the purchase.</p>
            </div>
          </section>
          <section className="apex-panel apex-panel-left" aria-labelledby="apex-logistics">
            <div className="apex-panel-copy">
              <p className="apex-kicker">International logistics</p>
              <h2 id="apex-logistics">From showroom to destination.</h2>
              <p>Enclosed collection, export documents, customs coordination and ocean freight arranged around your vehicle and destination.</p>
              <a href="#apex-process" className="apex-text-link">See the export process ↓</a>
            </div>
          </section>
        </div>
      </section>

      <section id="apex-collection" className="apex-section apex-catalogue">
        <header>
          <p className="apex-kicker">Sample catalogue</p>
          <h2>The Aventador collection.</h2>
          <p>Example configurations for private sourcing.</p>
        </header>
        <div className="apex-filters" role="group" aria-label="Filter vehicles">
          {filters.map((item) => (
            <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="apex-grid">
          {shown.map((car) => (
            <article key={car.id} className="apex-card">
              <img src={carImage(car.id)} alt={car.alt} loading="lazy" />
              <div>
                <p className="apex-kicker">{car.type} · {car.finish}</p>
                <h3>{car.name}</h3>
                <button type="button" className="apex-text-link" aria-label={'View details for ' + car.name} onClick={() => {
                  setSelected(car)
                  dialog.current?.showModal()
                }}>View details ↗</button>
              </div>
            </article>
          ))}
        </div>
        <dialog ref={dialog} className="apex-dialog" aria-labelledby="apex-vehicle-name">
          <button type="button" className="apex-close" onClick={() => dialog.current?.close()} aria-label="Close vehicle details" autoFocus>×</button>
          <img src={carImage(selected.id)} alt={selected.alt} loading="lazy" />
          <div>
            <p className="apex-kicker">{selected.type} · {selected.finish}</p>
            <h3 id="apex-vehicle-name">{selected.name}</h3>
            <p>{selected.description}</p>
            <a className="apex-button" href="#apex-quote" onClick={() => {
              setVehicle(selected.name)
              setPreview(null)
              dialog.current?.close()
            }}>Request this vehicle</a>
          </div>
        </dialog>
      </section>

      <section id="apex-process" className="apex-section apex-process">
        <header>
          <p className="apex-kicker">The export process</p>
          <h2>From first enquiry to delivery.</h2>
        </header>
        <ol>
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span aria-hidden="true">0{index + 1}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="apex-quote" className="apex-section apex-quote">
        <header>
          <p className="apex-kicker">Private client services</p>
          <h2>Begin your acquisition.</h2>
          <p>Enter a vehicle and destination to preview a quotation request. This concept form keeps your details on this page.</p>
        </header>
        <form onSubmit={submitQuote} onChange={() => setPreview(null)}>
          <label>Full name<input name="name" autoComplete="name" required pattern=".*\S.*" maxLength={100} /></label>
          <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
          <label>Destination country<input name="destination" autoComplete="country-name" required pattern=".*\S.*" maxLength={100} /></label>
          <label>Preferred vehicle<input name="vehicle" required pattern=".*\S.*" maxLength={120} value={vehicle} onChange={(event) => setVehicle(event.target.value)} /></label>
          <label className="apex-wide">Additional requirements <span>(optional)</span><textarea name="requirements" rows={3} maxLength={1000} /></label>
          <button className="apex-button apex-wide" type="submit">Preview quotation request</button>
          <div className="apex-wide apex-status" role="status">
            {preview && <p><strong>Demo request ready.</strong> {preview.name}, you selected the {preview.vehicle} for delivery to {preview.destination}.</p>}
          </div>
        </form>
      </section>

      <footer className="apex-footer">
        <span>Apex Global Motors · Concept website</span>
        <div>Photography by {cars.map((car) => <a key={car.id} href={car.source}>{car.credit}</a>)}</div>
      </footer>
    </main>
  )
}
