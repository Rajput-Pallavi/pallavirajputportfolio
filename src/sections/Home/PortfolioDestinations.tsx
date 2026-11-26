import type { ResolvedDestination } from './journeyConfig'

function BenchAndDiary() {
  return (
    <group rotation={[0, -0.55, 0]}>
      <mesh position={[0, 0.29, 0]} castShadow><boxGeometry args={[1.15, 0.12, 0.38]} /><meshStandardMaterial color="#69462d" roughness={0.82} /></mesh>
      <mesh position={[0, 0.66, 0.16]} rotation={[-0.15, 0, 0]} castShadow><boxGeometry args={[1.15, 0.48, 0.1]} /><meshStandardMaterial color="#765037" roughness={0.82} /></mesh>
      {[-0.43, 0.43].map((x) => <mesh key={x} position={[x, 0.12, 0]} castShadow><boxGeometry args={[0.09, 0.42, 0.3]} /><meshStandardMaterial color="#39271d" /></mesh>)}
      <mesh position={[0.22, 0.39, -0.05]} rotation={[0, 0.2, 0]} castShadow><boxGeometry args={[0.32, 0.035, 0.24]} /><meshStandardMaterial color="#a94242" roughness={0.9} /></mesh>
    </group>
  )
}

function SkillsBridge() {
  return (
    <group>
      {[-0.48, -0.16, 0.16, 0.48].map((x) => <mesh key={x} position={[x, 0.09, 0]} castShadow receiveShadow><boxGeometry args={[0.27, 0.14, 0.72]} /><meshStandardMaterial color="#787b82" roughness={0.96} /></mesh>)}
      {[-0.42, 0, 0.42].map((x, index) => (
        <group key={x} position={[x, 0.72, 0]}>
          <mesh castShadow><icosahedronGeometry args={[0.17, 1]} /><meshStandardMaterial color="#72d6ff" emissive="#1d7fa8" emissiveIntensity={0.75} /></mesh>
          {index === 1 && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.27, 0.025, 8, 24]} /><meshStandardMaterial color="#d9fbff" emissive="#63d9ff" emissiveIntensity={1.1} /></mesh>}
        </group>
      ))}
    </group>
  )
}

function PrayerPlatform() {
  return <mesh position={[0, 0.06, 0]} receiveShadow castShadow><cylinderGeometry args={[0.62, 0.72, 0.12, 10]} /><meshStandardMaterial color="#aaa49a" roughness={0.95} /></mesh>
}

function Workspace() {
  return (
    <group rotation={[0, -0.65, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[1.15, 0.1, 0.62]} /><meshStandardMaterial color="#71472b" roughness={0.72} /></mesh>
      {[-0.45, 0.45].flatMap((x) => [-0.22, 0.22].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.19, z]} castShadow><boxGeometry args={[0.08, 0.45, 0.08]} /><meshStandardMaterial color="#442b1e" /></mesh>))}
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.48, 0.035, 0.32]} /><meshStandardMaterial color="#353a42" metalness={0.55} /></mesh>
      <mesh position={[0, 0.72, 0.13]} rotation={[-0.15, 0, 0]} castShadow><boxGeometry args={[0.48, 0.36, 0.035]} /><meshStandardMaterial color="#24344a" emissive="#4e9bd1" emissiveIntensity={0.32} /></mesh>
    </group>
  )
}

function Viewpoint() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow><cylinderGeometry args={[0.72, 0.82, 0.08, 12]} /><meshStandardMaterial color="#8d8b87" roughness={0.96} /></mesh>
      {[-0.58, 0, 0.58].map((x) => <mesh key={x} position={[x, 0.4, -0.5]} castShadow><cylinderGeometry args={[0.025, 0.035, 0.8, 8]} /><meshStandardMaterial color="#574536" /></mesh>)}
      <mesh position={[0, 0.72, -0.5]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.025, 0.025, 1.25, 8]} /><meshStandardMaterial color="#574536" /></mesh>
    </group>
  )
}

export default function PortfolioDestinations({ destinations }: { destinations: ResolvedDestination[] }) {
  return destinations.map((destination) => (
    <group key={destination.id} name={`${destination.id}-destination`} position={destination.position} userData={destination}>
      {destination.id === 'home' && <Viewpoint />}
      {destination.id === 'about' && <BenchAndDiary />}
      {destination.id === 'skills' && <SkillsBridge />}
      {destination.id === 'faith' && <PrayerPlatform />}
      {destination.id === 'work' && <Workspace />}
      {destination.id === 'contact' && <Viewpoint />}
    </group>
  ))
}
