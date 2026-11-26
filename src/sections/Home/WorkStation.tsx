import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PointLight } from 'three'
import { useDayNight } from './DayNightController'

export default function WorkStation() {
  const lantern = useRef<PointLight>(null)
  const cycle = useDayNight()
  useFrame(() => { if (lantern.current) lantern.current.intensity = 0.35 + cycle.current.night * 0.7 })
  return <group rotation={[0, -0.18, 0]}>
    {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.72, 0.18]} castShadow><cylinderGeometry args={[0.08, 0.12, 1.45, 8]} /><meshStandardMaterial color="#583723" roughness={0.9} /></mesh>)}
    <mesh position={[0, 1.48, 0.18]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.25, 0.38, 4]} /><meshStandardMaterial color="#674229" roughness={0.9} /></mesh>
    <mesh position={[0, 1.65, 0.18]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.2, 0.18, 4]} /><meshStandardMaterial color="#edf4f7" roughness={1} /></mesh>
    {[-0.55, 0, 0.55].map((x, index) => <group key={x} position={[x, 0.78, 0.05]}>
      <mesh castShadow><boxGeometry args={[0.42, 0.58, 0.07]} /><meshStandardMaterial color="#5d3a25" roughness={0.84} /></mesh>
      <mesh position={[0, 0, -0.045]}><boxGeometry args={[0.32, 0.44, 0.025]} /><meshStandardMaterial color={['#8c6e4d', '#746f68', '#566c78'][index]} roughness={0.75} emissive={['#3b2417', '#292725', '#20343e'][index]} emissiveIntensity={0.16} /></mesh>
    </group>)}
    <group position={[0, 0.42, -0.38]}><mesh><cylinderGeometry args={[0.09, 0.11, 0.25, 8]} /><meshStandardMaterial color="#805936" /></mesh><mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.06, 10, 7]} /><meshStandardMaterial color="#ffd38a" emissive="#ffad4d" emissiveIntensity={2} /></mesh><pointLight ref={lantern} color="#ffc06b" distance={2.2} decay={2} /></group>
  </group>
}
