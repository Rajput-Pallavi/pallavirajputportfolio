import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CanvasTexture, MathUtils, MeshBasicMaterial, PointsMaterial, Vector3, type Group, type PointLight } from 'three'
import { useDayNight } from './DayNightController'

export default function TravellerGroundGlow() {
  const group = useRef<Group>(null)
  const glow = useRef<MeshBasicMaterial>(null)
  const sparkles = useRef<PointsMaterial>(null)
  const light = useRef<PointLight>(null)
  const scene = useThree((state) => state.scene)
  const cycle = useDayNight()
  const target = useMemo(() => new Vector3(), [])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 128
    const context = canvas.getContext('2d')!
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(226,240,255,.72)')
    gradient.addColorStop(.38, 'rgba(205,226,255,.28)')
    gradient.addColorStop(1, 'rgba(190,220,255,0)')
    context.fillStyle = gradient; context.fillRect(0, 0, 128, 128)
    return new CanvasTexture(canvas)
  }, [])
  const particles = useMemo(() => {
    const values: number[] = []
    for (let index = 0; index < 12; index++) {
      const angle = index * 2.399
      const radius = 0.18 + (index % 4) * 0.11
      values.push(Math.cos(angle) * radius, 0.025, Math.sin(angle) * radius)
    }
    return new Float32Array(values)
  }, [])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(({ clock }, delta) => {
    const traveller = scene.getObjectByName('pallavi-character')
    if (!traveller || !group.current) return
    const groundY = (traveller.userData.groundY as number | undefined) ?? traveller.position.y
    target.set(traveller.position.x, groundY + 0.025, traveller.position.z)
    group.current.position.lerp(target, 1 - Math.exp(-12 * delta))
    const night = cycle.current.night
    if (glow.current) glow.current.opacity = MathUtils.damp(glow.current.opacity, night * 0.34, 4, delta)
    if (sparkles.current) sparkles.current.opacity = MathUtils.damp(sparkles.current.opacity, night * (0.22 + Math.sin(clock.elapsedTime * 1.7) * 0.05), 4, delta)
    if (light.current) light.current.intensity = MathUtils.damp(light.current.intensity, night * 0.22, 4, delta)
  })

  return <group ref={group}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <circleGeometry args={[0.78, 32]} />
      <meshBasicMaterial ref={glow} map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
    <points renderOrder={3}><bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry><pointsMaterial ref={sparkles} color="#e5f2ff" size={0.022} transparent opacity={0} depthWrite={false} sizeAttenuation /></points>
    <pointLight ref={light} position={[0, 0.12, 0]} color="#d9ecff" intensity={0} distance={1.55} decay={2} />
  </group>
}
