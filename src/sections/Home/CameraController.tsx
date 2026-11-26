import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Mesh, Raycaster, Vector3 } from 'three'
import gsap from 'gsap'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
}

export const CAMERA_POSITIONS = {
  wide: { position: [11.5, 7.2, 15.5], target: [-0.75, 3.2, -3.3] },
  pathway: { position: [4.5, 2.15, 5.8], target: [0.1, 0.38, 1.75] },
  shivjiTerrace: { position: [7.2, 4.4, 10.5], target: [-0.75, 3.1, -3.6] },
  characterJourney: { position: [3.65, 1.55, 4.35], target: [0.45, 0.3, 1.95] },
  laptopWorkspace: { position: [3.55, 1.3, 3.25], target: [1.9, 0.3, 1.85] },
} as const satisfies Record<string, CameraPose>

type CameraControllerProps = {
  onCinematicChange: (active: boolean) => void
  controlsRef: MutableRefObject<OrbitControlsImpl | null>
  manualOrbitActive: boolean
  followEnabled?: boolean
}

export default function CameraController({ onCinematicChange, controlsRef, manualOrbitActive, followEnabled = false }: CameraControllerProps) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const timeline = useRef<gsap.core.Timeline>(null)
  const prefersReducedMotion = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const travellerFocus = useMemo(() => new Vector3(), [])
  const previousFocus = useMemo(() => new Vector3(), [])
  const focusDelta = useMemo(() => new Vector3(), [])
  const hasFocus = useRef(false)
  const raycaster = useMemo(() => new Raycaster(), [])
  const rayOrigin = useMemo(() => new Vector3(), [])
  const down = useMemo(() => new Vector3(0, -1, 0), [])
  const pose = useRef({
    x: CAMERA_POSITIONS.wide.position[0],
    y: CAMERA_POSITIONS.wide.position[1],
    z: CAMERA_POSITIONS.wide.position[2],
    tx: CAMERA_POSITIONS.wide.target[0],
    ty: CAMERA_POSITIONS.wide.target[1],
    tz: CAMERA_POSITIONS.wide.target[2],
  })

  const applyPose = useCallback(() => {
    const current = pose.current
    camera.position.set(current.x, current.y, current.z)
    camera.lookAt(current.tx, current.ty, current.tz)
    camera.updateMatrixWorld()
    invalidate()
  }, [camera, invalidate])

  const setPose = useCallback((next: CameraPose) => {
    Object.assign(pose.current, {
      x: next.position[0], y: next.position[1], z: next.position[2],
      tx: next.target[0], ty: next.target[1], tz: next.target[2],
    })
    applyPose()
  }, [applyPose])

  const finishIntro = useCallback(() => {
    timeline.current?.kill()
    timeline.current = null
    setPose(CAMERA_POSITIONS.shivjiTerrace)
    setIsPlaying(false)
    onCinematicChange(false)
  }, [onCinematicChange, setPose])

  const playIntro = useCallback(() => {
    timeline.current?.kill()
    setPose(CAMERA_POSITIONS.wide)

    if (prefersReducedMotion.current) {
      finishIntro()
      return
    }

    setIsPlaying(true)
    onCinematicChange(true)
    const toValues = (next: CameraPose) => ({
      x: next.position[0], y: next.position[1], z: next.position[2],
      tx: next.target[0], ty: next.target[1], tz: next.target[2],
    })

    timeline.current = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onUpdate: applyPose,
      onComplete: finishIntro,
    })
      .to(pose.current, { ...toValues(CAMERA_POSITIONS.pathway), duration: 4.2 })
      .to(pose.current, { ...toValues(CAMERA_POSITIONS.shivjiTerrace), duration: 3.2 }, '>-0.35')
  }, [applyPose, finishIntro, onCinematicChange, setPose])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = motion.matches
    playIntro()

    const updateMotion = () => {
      prefersReducedMotion.current = motion.matches
      if (motion.matches && timeline.current) finishIntro()
    }
    motion.addEventListener('change', updateMotion)
    return () => {
      motion.removeEventListener('change', updateMotion)
      timeline.current?.kill()
      onCinematicChange(false)
    }
  }, [finishIntro, onCinematicChange, playIntro])

  useFrame((_, delta) => {
    const traveller = scene.getObjectByName('pallavi-character')
    const controls = controlsRef.current
    if (traveller && controls && !isPlaying) {
      traveller.getWorldPosition(travellerFocus)
      travellerFocus.y += 0.9
      if (!hasFocus.current) {
        previousFocus.copy(travellerFocus)
        controls.target.copy(travellerFocus)
        controls.update()
        hasFocus.current = true
      } else if (followEnabled) {
        focusDelta.subVectors(travellerFocus, previousFocus)
        if (!manualOrbitActive) camera.position.add(focusDelta)
        controls.target.copy(travellerFocus)
        controls.update()
        previousFocus.copy(travellerFocus)
        invalidate()
      }
    }

    if (isPlaying) return
    const mountain = scene.getObjectByName('kailash-mountain')
    if (!mountain) return
    rayOrigin.set(camera.position.x, 20, camera.position.z)
    raycaster.set(rayOrigin, down)
    const terrainHit = raycaster.intersectObject(mountain, true)
      .find((hit) => hit.object instanceof Mesh && hit.object.geometry.type === 'PlaneGeometry')
    if (!terrainHit) return
    const minimumY = terrainHit.point.y + 0.28
    if (camera.position.y < minimumY) {
      camera.position.y = MathUtils.damp(camera.position.y, minimumY, 14, delta)
      camera.updateMatrixWorld()
      invalidate()
    }
  })

  return (
    <Html fullscreen zIndexRange={[20, 0]}>
      <div className="pointer-events-none flex h-full items-end justify-end p-5">
        <button
          type="button"
          onClick={isPlaying ? finishIntro : playIntro}
          className="pointer-events-auto rounded-full border border-white/40 bg-slate-950/55 px-5 py-2.5 text-base text-white backdrop-blur-sm"
        >
          {isPlaying ? 'Skip Intro' : 'Replay Intro'}
        </button>
      </div>
    </Html>
  )
}
