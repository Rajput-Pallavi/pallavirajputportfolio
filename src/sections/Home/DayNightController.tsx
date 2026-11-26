import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, MathUtils, Vector3 } from 'three'

export type DayNightState = {
  hour: number
  daylight: number
  twilight: number
  night: number
  sunPosition: Vector3
  moonPosition: Vector3
  upperSky: Color
  horizonSky: Color
  fogColor: Color
  snowColor: Color
  cloudLight: number
}

const initialState: DayNightState = {
  hour: 12,
  daylight: 1,
  twilight: 0,
  night: 0,
  sunPosition: new Vector3(),
  moonPosition: new Vector3(),
  upperSky: new Color(),
  horizonSky: new Color(),
  fogColor: new Color(),
  snowColor: new Color(),
  cloudLight: 1,
}

const DayNightContext = createContext<React.RefObject<DayNightState> | null>(null)
const nightUpper = new Color('#061126')
const dayUpper = new Color('#1767ad')
const nightHorizon = new Color('#151d38')
const dayHorizon = new Color('#b8d4e5')
const sunset = new Color('#f29a68')
const nightFog = new Color('#17243a')
const dayFog = new Color('#c8d5dc')
const nightSnow = new Color('#c6dcff')
const daySnow = new Color('#f4f8ff')

function localHour() {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function updateEnvironment(state: DayNightState, hour: number) {
  const sunAngle = ((hour - 6) / 24) * Math.PI * 2
  const moonAngle = sunAngle + Math.PI
  const elevation = Math.sin(sunAngle)
  state.hour = hour
  state.daylight = MathUtils.smoothstep(elevation, -0.08, 0.28)
  state.night = 1 - MathUtils.smoothstep(elevation, -0.22, 0.06)
  state.twilight = (1 - MathUtils.smoothstep(Math.abs(elevation), 0.06, 0.42)) * (1 - state.night * 0.35)
  state.sunPosition.set(-Math.cos(sunAngle) * 11, elevation * 10, -8.5)
  state.moonPosition.set(-Math.cos(moonAngle) * 4, 12, -10)
  state.upperSky.copy(nightUpper).lerp(dayUpper, state.daylight)
  state.horizonSky.copy(nightHorizon).lerp(dayHorizon, state.daylight).lerp(sunset, state.twilight * 0.78)
  state.fogColor.copy(nightFog).lerp(dayFog, state.daylight).lerp(sunset, state.twilight * 0.22)
  state.snowColor.copy(nightSnow).lerp(daySnow, state.daylight).lerp(sunset, state.twilight * 0.08)
  state.cloudLight = 0.3 + state.daylight * 0.7 + state.twilight * 0.15
}

// The scene consumers share this lightweight controller context.
// eslint-disable-next-line react-refresh/only-export-components
export function useDayNight() {
  const environment = useContext(DayNightContext)
  if (!environment) throw new Error('useDayNight must be used inside DayNightController')
  return environment
}

export default function DayNightController({ children, previewHour }: { children: ReactNode; previewHour: number | null }) {
  const environment = useRef({ ...initialState })
  const targetHour = useRef(localHour())
  const override = useRef(false)
  const reducedMotion = useRef(false)
  const invalidate = useThree((state) => state.invalidate)

  if (environment.current.upperSky.getHex() === 0) updateEnvironment(environment.current, targetHour.current)

  useEffect(() => {
    override.current = previewHour !== null
    targetHour.current = previewHour ?? localHour()
    invalidate()
  }, [invalidate, previewHour])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { reducedMotion.current = preference.matches }
    const clock = window.setInterval(() => {
      if (!override.current) {
        targetHour.current = localHour()
        invalidate()
      }
    }, 60_000)
    updateMotion()
    preference.addEventListener('change', updateMotion)
    return () => {
      window.clearInterval(clock)
      preference.removeEventListener('change', updateMotion)
    }
  }, [invalidate])

  useFrame((_, delta) => {
    const current = environment.current.hour
    const next = reducedMotion.current ? targetHour.current : MathUtils.damp(current, targetHour.current, 3.2, delta)
    if (Math.abs(next - current) < 0.0001) return
    updateEnvironment(environment.current, next)
  }, -100)

  return (
    <DayNightContext.Provider value={environment}>
      {children}
    </DayNightContext.Provider>
  )
}
