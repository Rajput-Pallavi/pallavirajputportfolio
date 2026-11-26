import { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, type Group } from 'three'

const Eagle = forwardRef<Group, { active: boolean }>(({ active }, ref) => {
  const leftWing = useRef<Group>(null)
  const rightWing = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!active) return
    const flap = Math.sin(clock.elapsedTime * 6.2) * 0.38
    if (leftWing.current) leftWing.current.rotation.z = MathUtils.damp(leftWing.current.rotation.z, 0.18 + flap, 10, 1 / 60)
    if (rightWing.current) rightWing.current.rotation.z = MathUtils.damp(rightWing.current.rotation.z, -0.18 - flap, 10, 1 / 60)
  })
  return <group ref={ref} visible={active} scale={0.8}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.13, 0.48, 6, 10]} /><meshStandardMaterial color="#3d2c22" roughness={0.9} /></mesh>
    <mesh position={[0, 0.08, -0.38]} scale={[0.8, 0.75, 1]}><sphereGeometry args={[0.16, 12, 8]} /><meshStandardMaterial color="#eee8d8" roughness={0.85} /></mesh>
    <mesh position={[0, 0.06, -0.55]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[0.055, 0.18, 5]} /><meshStandardMaterial color="#d3a84f" roughness={0.7} /></mesh>
    <group ref={leftWing} position={[0.08, 0.05, -0.02]}>{[0, 1, 2].map((index) => <mesh key={index} position={[0.28 + index * 0.2, 0, index * 0.035]} rotation={[0, 0, -0.08]} scale={[1, 0.12, 0.35]}><boxGeometry args={[0.45, 0.08, 0.34]} /><meshStandardMaterial color={index ? '#493328' : '#5b4030'} roughness={0.94} /></mesh>)}</group>
    <group ref={rightWing} position={[-0.08, 0.05, -0.02]}>{[0, 1, 2].map((index) => <mesh key={index} position={[-0.28 - index * 0.2, 0, index * 0.035]} rotation={[0, 0, 0.08]} scale={[1, 0.12, 0.35]}><boxGeometry args={[0.45, 0.08, 0.34]} /><meshStandardMaterial color={index ? '#493328' : '#5b4030'} roughness={0.94} /></mesh>)}</group>
    <mesh position={[0, 0.02, 0.38]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.4, 1]}><coneGeometry args={[0.17, 0.38, 4]} /><meshStandardMaterial color="#35271f" roughness={0.95} /></mesh>
  </group>
})
Eagle.displayName = 'Eagle'
export default Eagle
