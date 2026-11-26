import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './RealEstateDemo.css'

const properties = [
  {
    name: 'The Olive House', region: 'Mallorca', type: 'Villa', price: 4800000, beds: 5, baths: 5, area: 520,
    description: 'An arrival through olive groves gives way to terraces, generous entertaining rooms, and a pool set against the limestone hills.',
    photos: [['hero', 'Modern villa with a pool and garden'], ['living', 'Living room with warm neutral furnishings'], ['bedroom', 'Bedroom with textured linens']],
  },
  {
    name: 'Palazzo Alto', region: 'Lisbon', type: 'Penthouse', price: 3250000, beds: 3, baths: 3, area: 285,
    description: 'A full-floor city residence with tall windows, understated interiors, and space to dine outdoors above the rooftops.',
    photos: [['penthouse', 'Sunlit contemporary interior'], ['kitchen', 'Kitchen with an open worktop'], ['living', 'Seating area with neutral furnishings']],
  },
  {
    name: 'Casa dei Cedri', region: 'Lake Como', type: 'Retreat', price: 1950000, beds: 3, baths: 2, area: 240,
    description: 'Set among trees above the lakeshore, this compact retreat brings the landscape close through sheltered outdoor spaces and intimate rooms.',
    photos: [['retreat', 'Woodland home framed by trees'], ['bedroom', 'Textured bedroom interior'], ['kitchen', 'Kitchen with an open worktop']],
  },
  {
    name: 'Villa Solana', region: 'Mallorca', type: 'Villa', price: 5900000, beds: 6, baths: 6, area: 640,
    description: 'Wide terraces and a series of garden rooms create a tranquil setting for long lunches and evenings by the pool.',
    photos: [['villa', 'Contemporary residential architecture'], ['living', 'Living room with soft seating'], ['kitchen', 'Kitchen with an open worktop']],
  },
]

const priceLabel = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const photo = (name: string) => '/aurelia/' + name + '.jpg'

function dateFloor() {
  const today = new Date()
  return [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-')
}

export default function RealEstateDemo() {
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')
  const [active, setActive] = useState(properties[0])
  const [frame, setFrame] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selection, setSelection] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const gallery = useRef<HTMLDialogElement>(null)
  const date = useRef<HTMLInputElement>(null)
  const matches = properties.filter((property) =>
    (!region || region === property.region) &&
    (!type || type === property.type) &&
    (!budget || property.price <= Number(budget))
  )

  useEffect(() => {
    const title = document.title
    document.title = 'Aurelia Estates | Property Collection'
    return () => { document.title = title }
  }, [])

  function openProperty(property: typeof active) {
    setActive(property)
    setFrame(0)
    setGalleryOpen(true)
    gallery.current?.showModal()
  }

  function requestViewing() {
    setSelection(active.name)
    setConfirmation('')
    gallery.current?.close()
    document.getElementById('aurelia-appointment-title')?.focus()
  }

  function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!date.current) return
    date.current.min = dateFloor()
    if (!event.currentTarget.reportValidity()) return
    const [year, month, day] = date.current.value.split('-').map(Number)
    const formatted = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(year, month - 1, day))
    setConfirmation('Demo request recorded for ' + selection + ' on ' + formatted + '. No appointment was booked or information sent.')
    event.currentTarget.reset()
    setSelection('')
  }

  return (
    <main className="aurelia">
      <header className="ae-header">
        <a href="#aurelia-top" className="ae-brand">Aurelia <span>Estates</span></a>
        <nav aria-label="Aurelia Estates">
          <a href="#aurelia-collection">Properties</a>
          <a href="#aurelia-appointment">Private viewings</a>
        </nav>
        <a className="ae-back" href="/">Back to portfolio</a>
      </header>

      <section id="aurelia-top" className="ae-hero" aria-labelledby="aurelia-title">
        <img src={photo('hero')} alt="" fetchPriority="high" />
        <div className="ae-hero-content">
          <p className="ae-kicker">A luxury real estate concept</p>
          <h1 id="aurelia-title">Exceptional homes<br /><em>across Europe.</em></h1>
          <p>Four distinctive residences, from the hills of Mallorca to the edge of Lake Como.</p>
          <a className="ae-button ae-button-light" href="#aurelia-collection">Explore the collection</a>
        </div>
        <button className="ae-featured" type="button" onClick={() => openProperty(properties[0])}>The Olive House · Mallorca <span aria-hidden="true">↗</span></button>
      </section>

      <section className="ae-collection" id="aurelia-collection" aria-labelledby="aurelia-collection-title">
        <div className="ae-section-heading">
          <div><p className="ae-kicker">The collection</p><h2 id="aurelia-collection-title">Homes with character</h2></div>
          <p>Fictional listings with illustrative photography.</p>
        </div>
        <div className="ae-filters" aria-label="Property filters" role="group">
          <label>Location<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">All locations</option>{[...new Set(properties.map((property) => property.region))].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Property type<select value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option>{[...new Set(properties.map((property) => property.type))].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Maximum price<select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Any price</option><option value="2000000">€2 million</option><option value="3500000">€3.5 million</option><option value="5000000">€5 million</option></select></label>
          <button type="button" onClick={() => { setRegion(''); setType(''); setBudget('') }} className="ae-reset">Clear filters</button>
        </div>
        <p className="ae-result" role="status">{matches.length ? matches.length + (matches.length === 1 ? ' property' : ' properties') : 'No properties match these filters.'}</p>
        <div className="ae-grid">
          {matches.map((property) => (
            <article className="ae-property" key={property.name}>
              <img src={photo(property.photos[0][0])} alt={property.photos[0][1]} loading="lazy" />
              <div className="ae-property-body">
                <p className="ae-kicker">{property.region} · {property.type}</p>
                <h3>{property.name}</h3>
                <p>{property.beds} beds · {property.baths} baths · {property.area} m²</p>
                <div className="ae-property-bottom">
                  <strong>{priceLabel.format(property.price)}</strong>
                  <button type="button" onClick={() => openProperty(property)} aria-label={'View ' + property.name}>View property <span aria-hidden="true">↗</span></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ae-appointment" id="aurelia-appointment" aria-labelledby="aurelia-appointment-title">
        <div>
          <p className="ae-kicker">By appointment</p>
          <h2 id="aurelia-appointment-title" tabIndex={-1}>Arrange a private viewing</h2>
          <p>Choose a residence and a preferred date to try the demo booking experience.</p>
          <p className="ae-form-note">This form simulates a viewing request. Your details stay on this page.</p>
        </div>
        <form onSubmit={submitAppointment} onChange={() => setConfirmation('')}>
          <label>Full name<input autoComplete="name" name="name" required maxLength={100} pattern={String.raw`.*\S.*`} /></label>
          <label>Email<input type="email" autoComplete="email" name="email" required maxLength={254} /></label>
          <label>Residence<select name="property" required value={selection} onChange={(event) => setSelection(event.target.value)}><option value="">Choose a property</option>{properties.map((property) => <option key={property.name}>{property.name}</option>)}</select></label>
          <label>Preferred date<input ref={date} type="date" name="date" min={dateFloor()} onFocus={(event) => { event.currentTarget.min = dateFloor() }} required /></label>
          <button className="ae-button ae-button-light" type="submit">Request a viewing</button>
          <p className="ae-confirmation" role="status">{confirmation}</p>
        </form>
      </section>

      <footer className="ae-footer">
        <p className="ae-brand">Aurelia <span>Estates</span></p>
        <p>Concept website · Fictional listings · <a href="https://unsplash.com/license">Photography from Unsplash</a></p>
        <a href="/">Back to portfolio</a>
      </footer>

      <dialog ref={gallery} onClose={() => setGalleryOpen(false)} className="ae-dialog" aria-labelledby="aurelia-property-title">
        <div className="ae-detail">
          <header>
            <div><p className="ae-kicker">{active.region} · {active.type}</p><h2 id="aurelia-property-title">{active.name}</h2></div>
            <form method="dialog"><button type="submit" className="ae-close" aria-label="Close property details">×</button></form>
          </header>
          <figure>
            {galleryOpen ? <img src={photo(active.photos[frame][0])} alt={active.photos[frame][1]} /> : null}
            <figcaption aria-live="polite">{active.photos[frame][1]} · {frame + 1} of {active.photos.length}</figcaption>
          </figure>
          <div className="ae-gallery-controls" role="group" aria-label="Property gallery">
            <button type="button" onClick={() => setFrame((frame + active.photos.length - 1) % active.photos.length)}>Previous</button>
            {active.photos.map(([imageName], index) => <button type="button" key={imageName} aria-label={'Photo ' + (index + 1)} aria-pressed={frame === index} onClick={() => setFrame(index)}>{index + 1}</button>)}
            <button type="button" onClick={() => setFrame((frame + 1) % active.photos.length)}>Next</button>
          </div>
          <p className="ae-detail-meta">{priceLabel.format(active.price)} · {active.beds} beds · {active.baths} baths · {active.area} m²</p>
          <p>{active.description}</p>
          <button type="button" className="ae-button" onClick={requestViewing}>Request a viewing</button>
        </div>
      </dialog>
    </main>
  )
}

