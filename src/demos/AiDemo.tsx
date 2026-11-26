import { ArrowDown, ArrowLeft, ArrowRight, Bot, Braces, GitFork, Layers3, Radio, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './AiDemo.css'

const services = [
  { icon: GitFork, title: 'Workflow automation', text: 'Connect your tools and hand off repetitive work, from incoming requests to approvals.' },
  { icon: Bot, title: 'AI assistants', text: 'Give your team an assistant that can draft replies, summarize documents, and answer common questions.' },
  { icon: Layers3, title: 'Knowledge systems', text: 'Help people find the right answers in scattered documents and team resources.' },
]

const workflow = [
  { title: 'Capture', detail: 'An incoming support request starts the workflow. The message and account details are collected in one place.' },
  { title: 'Understand', detail: 'The assistant identifies the issue, retrieves relevant policy, and prepares a suggested reply.' },
  { title: 'Act', detail: 'A teammate reviews the draft. The approved reply is sent and the decision is recorded.' },
]

const plans = [
  { name: 'Starter', monthly: 49, annual: 39, description: 'For teams automating their first workflow.', features: ['3 workflows', '1 assistant', 'Email support'] },
  { name: 'Scale', monthly: 149, annual: 119, description: 'For teams with multiple processes to connect.', features: ['15 workflows', '5 assistants', 'Priority support'] },
  { name: 'Enterprise', monthly: null, annual: null, description: 'For organizations with custom requirements.', features: ['Custom workflow limits', 'Dedicated onboarding', 'Tailored integrations'] },
]

const answers = [
  ['Does this demo use a live AI model?', 'The assistant uses scripted responses that run entirely in your browser. It makes no model or API calls.'],
  ['What tools could a workflow connect?', 'A production implementation could connect CRMs, help desks, documents, and team chat using the integrations available in each tool.'],
  ['Can a person review an action before it runs?', 'Yes. The example workflow includes a human approval step before sending a reply.'],
  ['Can I purchase a plan or send an inquiry?', 'Nova Intelligence is a portfolio concept. Plans are illustrative and the contact form simulates submission.'],
]

const prompts = ['Automate support triage', 'Summarize customer feedback', 'Design an onboarding workflow']

function reply(prompt: string) {
  if (/support|triage|ticket/.test(prompt)) return 'Route each ticket by urgency and topic. Pull in the account history, draft a response, and send it to a teammate for approval.'
  if (/feedback|summari[sz]e/.test(prompt)) return 'Group feedback by recurring issue, count mentions, and include representative quotes. Share the top themes and assign each a next step.'
  if (/onboard|new hire/.test(prompt)) return 'Start when a hire is confirmed. Create an onboarding checklist, assign equipment and access requests, then schedule a first-week check-in.'
  return 'Start with the event that kicks off your workflow. List the information it needs, the action it should take, and where a person should review the result. Try asking about support, feedback, or onboarding for a concrete example.'
}

function NeuralNetwork() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let width = 0
    let height = 0
    const centers = [-0.39, -0.19, 0, 0.19, 0.39]
    const layers = centers.map((_, column) => Array.from({ length: [5, 8, 10, 8, 5][column] }, (_, index) => index))

    function draw(time: number) {
      if (!context) return
      context.clearRect(0, 0, width, height)
      const tick = time / 1000
      const points = layers.map((layer, column) => layer.map((index) => ({
        x: width * (0.5 + centers[column]) + Math.sin(index * 2.4 + column) * width * 0.045,
        y: height * (0.5 + (index / (layer.length - 1) - 0.5) * (0.48 + (2 - Math.abs(2 - column)) * 0.15))
          + Math.sin(tick + index * 1.8 + column) * height * 0.022,
      })))
      points.forEach((layer, column) => layer.forEach((point, index) => {
        points[column + 1]?.forEach((next, target) => {
          if (Math.abs(point.y - next.y) > height * 0.19) return
          context.strokeStyle = column % 2 ? '#a28aff47' : '#7898ff42'
          context.beginPath()
          context.moveTo(point.x, point.y)
          context.lineTo(next.x, next.y)
          context.stroke()
          if ((column + index + target) % 4 !== 0) return
          const progress = (tick * 0.48 + index * 0.37 + target * 0.19) % 1
          context.fillStyle = '#d7caff'
          context.beginPath()
          context.arc(point.x + (next.x - point.x) * progress, point.y + (next.y - point.y) * progress, 1.7, 0, 2 * Math.PI)
          context.fill()
        })
        const radius = column === 2 ? 3.2 : 2.3
        context.shadowBlur = 16
        context.shadowColor = '#a388ff'
        context.fillStyle = column === 2 ? '#e6d8ff' : '#9eaaff'
        context.beginPath()
        context.arc(point.x, point.y, radius, 0, 2 * Math.PI)
        context.fill()
        context.shadowBlur = 0
      }))
      if (!motion.matches) frame = requestAnimationFrame(draw)
    }

    function restart() {
      if (!element || !context) return
      cancelAnimationFrame(frame)
      width = element.clientWidth
      height = element.clientHeight
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      element.width = width * scale
      element.height = height * scale
      context.setTransform(scale, 0, 0, scale, 0, 0)
      draw(0)
    }

    const observer = new ResizeObserver(restart)
    observer.observe(element)
    motion.addEventListener('change', restart)
    restart()
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', restart)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvas} className="nova-network" aria-hidden="true" />
}

export default function AiDemo() {
  const [draft, setDraft] = useState('')
  const [exchange, setExchange] = useState<{ prompt: string; answer: string }>()
  const [step, setStep] = useState(0)
  const [annual, setAnnual] = useState(false)
  const [interest, setInterest] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const title = document.title
    document.title = 'Nova Intelligence | Portfolio Concept'
    return () => { document.title = title }
  }, [])

  function ask(prompt: string) {
    const clean = prompt.trim()
    if (!clean) return
    setExchange({ prompt: clean, answer: reply(clean.toLowerCase()) })
    setDraft('')
  }

  function contact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
    setInterest('')
  }

  return <main className="nova">
    <header className="nova-header">
      <a className="nova-brand" href="#nova-top"><Sparkles size={22} aria-hidden="true" /> Nova Intelligence</a>
      <nav aria-label="Nova navigation"><a href="#nova-services">Services</a><a href="#nova-pricing">Pricing</a><a href="#nova-contact">Contact</a></nav>
      <a className="nova-back" href="/"><ArrowLeft size={15} aria-hidden="true" /> Back to Portfolio</a>
    </header>

    <section className="nova-hero nova-wrap" id="nova-top">
      <div className="nova-hero-copy">
        <p className="nova-kicker"><span /> Portfolio concept</p>
        <h1>Make work flow <em>with AI.</em></h1>
        <p className="nova-lede">Nova helps teams connect their tools, put knowledge to work, and automate the tasks that slow them down.</p>
        <div className="nova-actions">
          <a className="nova-button" href="#nova-assistant">Try the assistant <ArrowRight size={17} aria-hidden="true" /></a>
          <a className="nova-button nova-secondary" href="#nova-services">Explore services <ArrowDown size={16} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="nova-visual" aria-hidden="true"><NeuralNetwork /></div>
    </section>

    <section className="nova-wrap nova-section nova-split" id="nova-assistant">
      <div><p className="nova-kicker">Interactive demo</p><h2>Ask Nova where to start.</h2><p>Describe a task your team repeats or choose an example. Nova will suggest a way to automate it.</p></div>
      <div className="nova-panel nova-chat">
        <div className="nova-chat-head"><Bot size={21} aria-hidden="true" /> <strong>Nova Assistant</strong><span>Simulation</span></div>
        <div className="nova-chat-output" aria-live="polite">
          {exchange && <p className="nova-prompt">{exchange.prompt}</p>}
          <p className="nova-answer">{exchange?.answer ?? 'What would you like to automate today?'}</p>
        </div>
        <div className="nova-chips">{prompts.map(prompt => <button key={prompt} type="button" onClick={() => ask(prompt)}>{prompt}</button>)}</div>
        <form className="nova-chat-form" onSubmit={event => { event.preventDefault(); ask(draft) }}>
          <label className="nova-sr" htmlFor="nova-prompt">Your message</label>
          <input id="nova-prompt" value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} placeholder="Describe a recurring task…" required />
          <button type="submit" className="nova-button" disabled={!draft.trim()}>Send <ArrowRight size={16} aria-hidden="true" /></button>
        </form>
      </div>
    </section>

    <section className="nova-wrap nova-section" id="nova-services">
      <p className="nova-kicker">Services</p><h2>Where Nova can help</h2>
      <div className="nova-cards">{services.map(({ icon: Icon, title, text }) => <article className="nova-panel nova-card" key={title}>
        <Icon size={25} aria-hidden="true" /><h3>{title}</h3><p>{text}</p>
      </article>)}</div>
    </section>

    <section className="nova-wrap nova-section nova-split">
      <div><p className="nova-kicker">Example workflow</p><h2>From support ticket to approved reply.</h2><p>Choose a step to see how the request moves through the workflow.</p></div>
      <div className="nova-panel nova-workflow">
        <div className="nova-steps">{workflow.map(({ title }, index) => <button key={title} type="button" aria-pressed={step === index} onClick={() => setStep(index)}><Radio size={17} aria-hidden="true" /> {title}</button>)}</div>
        <div className="nova-track" aria-hidden="true"><span style={{ width: `${(step + 1) / workflow.length * 100}%` }} /></div>
        <div className="nova-step-detail" aria-live="polite"><h3>{workflow[step].title}</h3><p>{workflow[step].detail}</p></div>
      </div>
    </section>

    <section className="nova-wrap nova-section" id="nova-pricing">
      <p className="nova-kicker">Illustrative pricing</p><div className="nova-pricing-head"><h2>Find a plan for your team</h2>
      <div className="nova-toggle" role="group" aria-label="Billing period"><button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Monthly</button><button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Yearly</button></div></div>
      <div className="nova-cards">{plans.map(plan => {
        const price = annual ? plan.annual : plan.monthly
        return <article className={`nova-panel nova-card ${plan.name === 'Scale' ? 'nova-featured' : ''}`} key={plan.name}>
          <h3>{plan.name}</h3><p className="nova-price">{price === null ? 'Custom' : <>${price}<span> / mo</span></>}</p>
          <p>{price !== null && annual ? `$${price * 12} billed yearly. ` : ''}{plan.description}</p>
          <ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
          <a className="nova-button nova-secondary" href="#nova-contact" onClick={() => { setInterest(plan.name); setSubmitted(false) }}>Ask about {plan.name} <ArrowRight size={16} aria-hidden="true" /></a>
        </article>
      })}</div>
    </section>

    <section className="nova-wrap nova-section nova-split">
      <div><p className="nova-kicker">FAQ</p><h2>Common questions</h2></div>
      <div className="nova-faq">{answers.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="nova-wrap nova-section nova-split" id="nova-contact">
      <div><p className="nova-kicker">Contact</p><h2>What would you automate first?</h2><p>Try the inquiry form with a sample project. Submissions are simulated and stay in this page.</p></div>
      <form className="nova-panel nova-contact" onSubmit={contact} onChange={() => setSubmitted(false)}>
        <label>Name<input name="name" autoComplete="name" required maxLength={100} pattern=".*\S.*" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={200} /></label>
        <label>Plan interest<select name="plan" value={interest} onChange={event => setInterest(event.target.value)}><option value="">Choose a plan (optional)</option>{plans.map(({ name }) => <option key={name}>{name}</option>)}</select></label>
        <label>Project details<textarea name="message" required minLength={10} maxLength={1500} rows={4} onChange={event => event.target.setCustomValidity(event.target.value.trim().length < 10 ? 'Enter at least 10 characters about your project.' : '')} /></label>
        <button className="nova-button" type="submit">Simulate inquiry <ArrowRight size={17} aria-hidden="true" /></button>
        <p className="nova-status" role="status">{submitted ? 'Demo inquiry submitted successfully.' : ''}</p>
      </form>
    </section>

    <footer className="nova-wrap nova-footer"><span><Braces size={17} aria-hidden="true" /> Nova Intelligence · Portfolio concept</span><a href="/">Back to Portfolio <ArrowRight size={15} aria-hidden="true" /></a></footer>
  </main>
}
