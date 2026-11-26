import { lazy, Suspense } from 'react'

const Portfolio = lazy(() => import('./PortfolioApp'))
const demos = {
  '/demo/automobile': lazy(() => import('./demos/AutomobileDemo')),
  '/demo/real-estate': lazy(() => import('./demos/RealEstateDemo')),
  '/demo/ai': lazy(() => import('./demos/AiDemo')),
} as const

export default function App() {
  const Demo = demos[window.location.pathname as keyof typeof demos]
  return <Suspense fallback={null}>{Demo ? <Demo /> : <Portfolio />}</Suspense>
}
