import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import type { ResolvedDestination } from './journeyConfig'

type PathPoint = [number, number, number]
type JourneyStop = ResolvedDestination & { pathProgress: number }

export default function JourneyController({ enabled }: { enabled: boolean }) {
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const targetSection = useRef(0)
  const currentSection = useRef(0)
  const direction = useRef(1)
  const snapTimer = useRef<number | undefined>(undefined)
  const position = useMemo(() => new Vector3(), [])
  const nextPosition = useMemo(() => new Vector3(), [])

  useEffect(() => {
    const syncScroll = () => {
      if (!enabled) return
      const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const section = MathUtils.clamp(window.scrollY / range, 0, 1) * 5
      const difference = section - targetSection.current
      if (Math.abs(difference) > 0.0001) direction.current = Math.sign(difference)
      targetSection.current = section
      window.clearTimeout(snapTimer.current)
      snapTimer.current = window.setTimeout(() => {
        targetSection.current = Math.round(section)
        invalidate()
      }, 140)
      invalidate()
    }
    syncScroll()
    window.addEventListener('scroll', syncScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', syncScroll)
      window.clearTimeout(snapTimer.current)
    }
  }, [enabled, invalidate])

  useFrame((_, delta) => {
    if (!enabled) return
    const mountain = scene.getObjectByName('kailash-mountain')
    const traveller = scene.getObjectByName('pallavi-character')
    const path = mountain?.userData.walkingPath as PathPoint[] | undefined
    const stops = mountain?.userData.journeyStops as JourneyStop[] | undefined
    if (!traveller || !path?.length || !stops?.length) return

    currentSection.current = MathUtils.damp(currentSection.current, targetSection.current, 5.8, delta)
    const section = MathUtils.clamp(currentSection.current, 0, stops.length - 1)
    const stopIndex = Math.min(stops.length - 2, Math.floor(section))
    const sectionBlend = MathUtils.smootherstep(section - stopIndex, 0, 1)
    const pathProgress = MathUtils.lerp(stops[stopIndex].pathProgress, stops[stopIndex + 1].pathProgress, sectionBlend)
    const scaledPath = pathProgress * (path.length - 1)
    const pathIndex = Math.min(path.length - 2, Math.floor(scaledPath))
    const pathBlend = scaledPath - pathIndex
    position.fromArray(path[pathIndex]).lerp(nextPosition.fromArray(path[pathIndex + 1]), pathBlend)
    traveller.position.set(position.x, position.y + 0.03, position.z)

    const travelDelta = targetSection.current - currentSection.current
    const moving = Math.abs(travelDelta) > 0.0015
    if (moving) direction.current = Math.sign(travelDelta)
    let facingX: number
    let facingZ: number
    if (moving) {
      const previous = path[Math.max(0, pathIndex - 1)]
      const next = path[Math.min(path.length - 1, pathIndex + 1)]
      facingX = (next[0] - previous[0]) * direction.current
      facingZ = (next[2] - previous[2]) * direction.current
    } else {
      const stop = stops[Math.round(section)]
      facingX = stop.facing[0]
      facingZ = stop.facing[2]
    }
    const desiredYaw = Math.atan2(facingX, facingZ)
    const yawDifference = Math.atan2(Math.sin(desiredYaw - traveller.rotation.y), Math.cos(desiredYaw - traveller.rotation.y))
    traveller.rotation.y += yawDifference * (1 - Math.exp(-9 * delta))
    traveller.userData.motion = moving ? 'walk' : 'idle'
    traveller.userData.direction = direction.current
    if (moving) invalidate()
  })

  return null
}
