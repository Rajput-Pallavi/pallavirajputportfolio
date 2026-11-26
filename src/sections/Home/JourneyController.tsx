import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import type { ResolvedDestination } from './journeyConfig'

type JourneyStop = ResolvedDestination & { pathProgress: number }
type Teleport = { destination: number; elapsed: number; relocated: boolean }

function destinationMotion(index: number) {
  return ['home-wave', 'about-read', 'skills-look', 'prayer', 'work-view', 'home-wave'][index] ?? 'idle'
}

export default function JourneyController({ enabled }: { enabled: boolean }) {
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const teleport = useRef<Teleport | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const navigate = (event: Event) => {
      if (!enabled) return
      teleport.current = { destination: MathUtils.clamp((event as CustomEvent<number>).detail, 0, 5), elapsed: 0, relocated: false }
      const traveller = scene.getObjectByName('pallavi-character')
      if (traveller) traveller.userData.motion = 'teleport'
      invalidate()
    }
    window.addEventListener('journey:navigate', navigate)
    return () => window.removeEventListener('journey:navigate', navigate)
  }, [enabled, invalidate, scene])

  useFrame((_, delta) => {
    if (!enabled) return
    const mountain = scene.getObjectByName('kailash-mountain')
    const traveller = scene.getObjectByName('pallavi-character')
    const stops = mountain?.userData.journeyStops as JourneyStop[] | undefined
    if (!traveller || !stops?.length) return

    if (!initialized.current) {
      const home = stops[0]
      traveller.position.set(home.position[0], home.position[1] + 0.03, home.position[2])
      traveller.rotation.y = 0
      traveller.userData.groundY = home.position[1] + 0.03
      traveller.userData.teleportOpacity = 1
      traveller.userData.teleportGlow = 0
      traveller.userData.motion = destinationMotion(0)
      initialized.current = true
    }

    const active = teleport.current
    if (!active) return
    active.elapsed += delta
    const progress = MathUtils.clamp(active.elapsed / 1.5, 0, 1)
    const half = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2
    traveller.userData.teleportOpacity = progress < 0.5 ? 1 - MathUtils.smootherstep(half, 0, 1) : MathUtils.smootherstep(half, 0, 1)
    traveller.userData.teleportGlow = Math.sin(Math.PI * progress)
    traveller.userData.motion = 'teleport'

    if (progress >= 0.5 && !active.relocated) {
      const stop = stops[active.destination]
      traveller.position.set(stop.position[0], stop.position[1] + 0.03, stop.position[2])
      traveller.userData.groundY = stop.position[1] + 0.03
      const facing = active.destination === 3 ? stop.facing : active.destination === 0 || active.destination === 5 ? [0, 0, 1] : stop.facing
      traveller.rotation.y = Math.atan2(facing[0], facing[2])
      active.relocated = true
    }

    if (progress >= 1) {
      traveller.userData.teleportOpacity = 1
      traveller.userData.teleportGlow = 0
      traveller.userData.motion = destinationMotion(active.destination)
      window.dispatchEvent(new CustomEvent('journey:arrived', { detail: active.destination }))
      teleport.current = null
    }
    invalidate()
  })

  return null
}
