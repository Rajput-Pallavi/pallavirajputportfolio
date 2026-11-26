import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Box3, CatmullRomCurve3, MathUtils, PerspectiveCamera, Vector3, type Group } from 'three'
import gsap from 'gsap'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import Eagle from './Eagle'

export const CAMERA_POSITIONS = { wide: { position: [0, 8.8, 22] as [number, number, number] } }
let introCompletedThisLoad = false

export default function CameraController({ controlsRef, onIntroChange }: {
  controlsRef: MutableRefObject<OrbitControlsImpl | null>
  onIntroChange: (active: boolean) => void
}) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const bounds = useMemo(() => new Box3(), [])
  const center = useMemo(() => new Vector3(), [])
  const size = useMemo(() => new Vector3(), [])
  const point = useMemo(() => new Vector3(), [])
  const defaultPosition = useMemo(() => new Vector3(), [])
  const defaultTarget = useMemo(() => new Vector3(), [])
  const eaglePosition = useMemo(() => new Vector3(), [])
  const tangent = useMemo(() => new Vector3(), [])
  const followPosition = useMemo(() => new Vector3(), [])
  const lookTarget = useMemo(() => new Vector3(), [])
  const eagle = useRef<Group>(null)
  const path = useRef<CatmullRomCurve3 | null>(null)
  const timeline = useRef<gsap.core.Timeline>(null)
  const motion = useRef({ progress: 0, blend: 0 })
  const framed = useRef(false)
  const running = useRef(false)
  const [showSkip, setShowSkip] = useState(false)

  const finish = useCallback(() => {
    timeline.current?.kill(); timeline.current = null
    const controls = controlsRef.current
    camera.position.copy(defaultPosition)
    if (controls) { controls.target.copy(defaultTarget); controls.update() }
    camera.lookAt(defaultTarget); camera.updateMatrixWorld()
    running.current = false; introCompletedThisLoad = true; setShowSkip(false); onIntroChange(false); invalidate()
  }, [camera, controlsRef, defaultPosition, defaultTarget, invalidate, onIntroChange])

  useEffect(() => () => { timeline.current?.kill() }, [])

  useFrame(() => {
    const controls = controlsRef.current
    if (!framed.current) {
      const mountain = scene.getObjectByName('kailash-mountain'), shivji = scene.getObjectByName('shivji')
      if (!mountain || !shivji || !controls) return
      bounds.makeEmpty().expandByObject(mountain).expandByObject(shivji)
      const stops = mountain.userData.journeyStops as Array<{ position: [number, number, number] }> | undefined
      stops?.forEach((stop) => bounds.expandByPoint(point.fromArray(stop.position)))
      bounds.getCenter(center); bounds.getSize(size)
      const perspective = camera as PerspectiveCamera
      const vfov = MathUtils.degToRad(perspective.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * perspective.aspect)
      const distance = 1.16 * (Math.max(size.y / (2 * Math.tan(vfov / 2)), size.x / (2 * Math.tan(hfov / 2))) + size.z / 2)
      defaultPosition.set(center.x, center.y + distance * .12, center.z + distance); defaultTarget.copy(center)
      perspective.near = Math.max(.05, distance / 500); perspective.far = Math.max(100, distance + size.length() * 4); perspective.updateProjectionMatrix()
      framed.current = true
      if (introCompletedThisLoad) { finish(); return }
      path.current = new CatmullRomCurve3([
        center.clone().add(new Vector3(-7, size.y + 9, 12)), center.clone().add(new Vector3(-4, size.y + 6, 7)),
        center.clone().add(new Vector3(0, size.y + 2.5, 2)), center.clone().add(new Vector3(5, size.y + 8, -5)),
      ], false, 'centripetal')
      running.current = true; setShowSkip(true); onIntroChange(true)
      timeline.current = gsap.timeline({ onUpdate: invalidate, onComplete: finish })
        .to(motion.current, { progress: .78, duration: 6, ease: 'power1.inOut' })
        .to(motion.current, { progress: 1, blend: 1, duration: 2, ease: 'power2.inOut' })
      return
    }
    if (!running.current || !path.current || !eagle.current || !controls) return
    path.current.getPointAt(motion.current.progress, eaglePosition)
    path.current.getTangentAt(Math.min(.999, motion.current.progress), tangent).normalize()
    eagle.current.position.copy(eaglePosition); eagle.current.lookAt(point.copy(eaglePosition).add(tangent))
    eagle.current.scale.setScalar(.8 * MathUtils.lerp(1, .22, MathUtils.smoothstep(motion.current.progress, .78, 1)))
    followPosition.copy(eaglePosition).addScaledVector(tangent, -4.2); followPosition.y += 1.7
    camera.position.copy(followPosition).lerp(defaultPosition, motion.current.blend)
    lookTarget.copy(eaglePosition).addScaledVector(tangent, 2).lerp(defaultTarget, motion.current.blend)
    controls.target.copy(lookTarget); controls.update(); camera.updateMatrixWorld()
  })

  return <><Eagle ref={eagle} active={running.current} />{showSkip && <Html fullscreen zIndexRange={[30, 0]}><button type="button" onClick={finish} className="absolute bottom-5 right-5 rounded-full border border-white/30 bg-slate-950/35 px-4 py-2 text-sm text-white backdrop-blur-sm">Skip Intro</button></Html>}</>
}
