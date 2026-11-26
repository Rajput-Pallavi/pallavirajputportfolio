import type { ResolvedDestination } from './journeyConfig'
import SkillsTree from './SkillsTree'
import WorkStation from './WorkStation'

function NaturalPlatform() {
  return (
    <group position={[0, -0.015, 0]}>
      <mesh receiveShadow castShadow><cylinderGeometry args={[0.8, 0.9, 0.1, 12]} /><meshStandardMaterial color="#77736d" roughness={1} /></mesh>
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.72, 0.055, 6, 18]} /><meshStandardMaterial color="#edf3f7" roughness={1} /></mesh>
    </group>
  )
}

function BenchAndDiary() {
  return (
    <group rotation={[0, -0.25, 0]}>
      {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 0.72, 0.18]} castShadow><cylinderGeometry args={[0.08, 0.12, 1.45, 8]} /><meshStandardMaterial color="#5b3825" roughness={0.9} /></mesh>)}
      <mesh position={[0, 1.48, 0.18]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[1.12, 0.35, 4]} /><meshStandardMaterial color="#68432a" roughness={0.88} /></mesh>
      <mesh position={[0, 1.64, 0.18]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.08, 0.18, 4]} /><meshStandardMaterial color="#edf4f7" roughness={1} /></mesh>
      <mesh position={[0, 0.47, 0]} castShadow><cylinderGeometry args={[0.18, 0.28, 0.82, 6]} /><meshStandardMaterial color="#67432b" roughness={0.88} /></mesh>
      <group position={[0, 0.9, -0.03]}>
        <mesh position={[-0.18, 0, 0]} rotation={[0.08, 0.18, -0.05]}><boxGeometry args={[0.36, 0.025, 0.48]} /><meshStandardMaterial color="#eee1bf" roughness={0.95} /></mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0.08, -0.18, 0.05]}><boxGeometry args={[0.36, 0.025, 0.48]} /><meshStandardMaterial color="#f5e9c9" roughness={0.95} /></mesh>
      </group>
    </group>
  )
}

function PrayerPlatform() {
  return <group><mesh position={[0, 0.06, 0]} receiveShadow castShadow><cylinderGeometry args={[0.68, 0.78, 0.12, 10]} /><meshStandardMaterial color="#8e8981" roughness={0.98} /></mesh>{[-0.48, 0.48].map((x) => <group key={x} position={[x, 0.18, -0.28]}><mesh><cylinderGeometry args={[0.09, 0.12, 0.06, 10]} /><meshStandardMaterial color="#8a572d" roughness={0.9} /></mesh><mesh position={[0, 0.08, 0]}><sphereGeometry args={[0.035, 8, 6]} /><meshStandardMaterial color="#ffd27c" emissive="#ff9f3f" emissiveIntensity={2} /></mesh><pointLight position={[0, 0.1, 0]} color="#ffbd68" intensity={0.35} distance={1.2} /></group>)}</group>
}

function Viewpoint() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow><cylinderGeometry args={[0.72, 0.82, 0.08, 12]} /><meshStandardMaterial color="#8d8b87" roughness={0.96} /></mesh>
      {[-0.58, 0, 0.58].map((x) => <mesh key={x} position={[x, 0.4, -0.5]} castShadow><cylinderGeometry args={[0.035, 0.055, 0.8, 8]} /><meshStandardMaterial color="#574536" /></mesh>)}
      <mesh position={[0, 0.72, -0.5]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.25, 8]} /><meshStandardMaterial color="#574536" /></mesh>
      {[-0.58, 0.58].map((x) => <group key={x} position={[x, 0.82, -0.5]}><mesh><boxGeometry args={[0.13, 0.2, 0.13]} /><meshStandardMaterial color="#60412d" /></mesh><mesh><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color="#ffd38a" emissive="#ffad4d" emissiveIntensity={2} /></mesh><pointLight color="#ffc06b" intensity={0.35} distance={1.5} /></group>)}
    </group>
  )
}

function HomeEntrance() {
  return (
    <group position={[0, 0, -0.08]}>
      {[-0.78, 0.78].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.78, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 1.55, 10]} /><meshStandardMaterial color="#5b3824" roughness={0.86} /></mesh>
          <mesh position={[x, 1.58, 0]} scale={[1, 0.28, 1]}><sphereGeometry args={[0.17, 10, 6]} /><meshStandardMaterial color="#edf4f8" roughness={1} /></mesh>
          <mesh position={[x * 0.78, 1.18, 0.08]} castShadow><cylinderGeometry args={[0.09, 0.11, 0.25, 8]} /><meshStandardMaterial color="#7b542f" roughness={0.75} /></mesh>
          <mesh position={[x * 0.78, 1.18, 0.08]}><sphereGeometry args={[0.065, 12, 8]} /><meshStandardMaterial color="#ffd58a" emissive="#ff9f43" emissiveIntensity={2.2} /></mesh>
          <pointLight position={[x * 0.78, 1.18, 0.2]} color="#ffc06a" intensity={1.1} distance={2.4} decay={2} />
        </group>
      ))}
      <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[1.75, 0.22, 0.24]} /><meshStandardMaterial color="#654027" roughness={0.84} /></mesh>
      <mesh position={[0, 1.68, 0]} scale={[1, 0.3, 1]}><boxGeometry args={[1.82, 0.18, 0.29]} /><meshStandardMaterial color="#edf4f8" roughness={1} /></mesh>
    </group>
  )
}

export default function PortfolioDestinations({ destinations }: { destinations: ResolvedDestination[] }) {
  return destinations.map((destination) => (
    <group key={destination.id} name={`${destination.id}-destination`} position={destination.position} userData={destination}>
      <NaturalPlatform />
      {destination.id === 'home' && <HomeEntrance />}
      {destination.id === 'about' && <BenchAndDiary />}
      {destination.id === 'skills' && <SkillsTree />}
      {destination.id === 'faith' && <PrayerPlatform />}
      {destination.id === 'work' && <WorkStation />}
      {destination.id === 'contact' && <Viewpoint />}
    </group>
  ))
}
