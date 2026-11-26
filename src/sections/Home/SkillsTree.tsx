import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, MeshStandardMaterial, PointLight } from 'three'
import { useDayNight } from './DayNightController'

const branches = [
  ['Frontend', -0.72, -0.28, 1.05], ['Backend', 0, -0.42, 1.2],
  ['Database', 0.72, -0.28, 1.05], ['AI Engineering', -0.72, 0.35, 1.08],
  ['Developer Tools', 0, 0.48, 1.22], ['Creative Development', 0.72, 0.35, 1.08],
] as const

export default function SkillsTree() {
  const target = useRef(0)
  const glow = useRef(0)
  const materials = useRef<MeshStandardMaterial[]>([])
  const lights = useRef<PointLight[]>([])
  const cycle = useDayNight()
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const arrived = (event: Event) => { if ((event as CustomEvent<number>).detail === 2) target.current = 1; invalidate() }
    const navigate = () => { target.current = 0; invalidate() }
    window.addEventListener('journey:arrived', arrived)
    window.addEventListener('journey:navigate', navigate)
    return () => { window.removeEventListener('journey:arrived', arrived); window.removeEventListener('journey:navigate', navigate) }
  }, [invalidate])

  useFrame((_, delta) => {
    glow.current = MathUtils.damp(glow.current, target.current, 2.4, delta)
    materials.current.forEach((material, index) => { material.emissiveIntensity = glow.current * (0.45 + index * 0.08) })
    lights.current.forEach((light, index) => { light.intensity = glow.current * (0.35 + cycle.current.night * 0.8) * (1 + index * 0.04) })
    if (Math.abs(glow.current - target.current) > 0.002) invalidate()
  })

  return (
    <group>
      {branches.map(([label, x, z, height], index) => (
        <group key={label} position={[x, 0, z]} onClick={(event) => { event.stopPropagation(); window.dispatchEvent(new CustomEvent('skills:select', { detail: label })) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = '' }}>
          <mesh position={[0, height / 2, 0]} castShadow><cylinderGeometry args={[0.13, 0.18, height, 8]} /><meshStandardMaterial color={index % 2 ? '#6a472f' : '#77736d'} roughness={0.95} /></mesh>
          <mesh position={[0, height * 0.58, 0.135]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.07, 0.012, 6, 12]} /><meshStandardMaterial color="#c5a46a" roughness={0.7} /></mesh>
          <mesh position={[0, height + 0.04, 0]} scale={[1, 0.3, 1]}><sphereGeometry args={[0.18, 10, 6]} /><meshStandardMaterial color="#edf5f8" roughness={1} /></mesh>
          <mesh position={[0, height + 0.18, 0]}><sphereGeometry args={[0.065, 10, 7]} /><meshStandardMaterial ref={(material) => { if (material) materials.current[index] = material }} color="#ffe0a0" emissive="#ffc76b" emissiveIntensity={0} /></mesh>
          <pointLight ref={(light) => { if (light) lights.current[index] = light }} position={[0, height + 0.18, 0.05]} color="#ffd18a" intensity={0} distance={1.8} decay={2} />
        </group>
      ))}
    </group>
  )
}
