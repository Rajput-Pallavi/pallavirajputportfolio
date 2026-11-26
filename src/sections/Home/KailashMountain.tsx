import { useEffect, useMemo } from 'react'
import {
  BufferGeometry, CatmullRomCurve3, CircleGeometry, Color, DataTexture, Float32BufferAttribute, LinearFilter, LinearMipmapLinearFilter,
  MathUtils, PlaneGeometry, RepeatWrapping, RGBAFormat, Vector3,
} from 'three'
import PortfolioDestinations from './PortfolioDestinations'
import { JOURNEY_PATH_WAYPOINTS, resolveDestinations } from './journeyConfig'

const { lerp, smoothstep } = MathUtils

const terraces = [
  { name: 'shivji-terrace', x: -0.75, z: 1.65, y: 0.24, width: 0.46, depth: 0.36 },
  { name: 'workspace-terrace', x: 5.35, z: -0.9, y: 0.08, width: 0.47, depth: 0.34 },
] as const

// [x, z, height, footprint width, footprint depth]
const ridges = [
  [-3.65, -2.25, 1.86, 2.35, 1.75],
  [-4.85, -4.2, 2.47, 2.45, 2.1],
  [-1.85, -4.75, 2.35, 2.1, 2],
  [0.85, -4.8, 2.45, 2.05, 2.05],
  [2.8, -3.65, 2.55, 1.95, 2.05],
  [3.55, -2.2, 1.84, 1.65, 1.95],
  [4.9, -3.3, 2.08, 2.4, 2.05],
] as const

function hash(x: number, z: number) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function noise(x: number, z: number) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const u = smoothstep(x - ix, 0, 1)
  const v = smoothstep(z - iz, 0, 1)
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), u), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v)
}

function trailCenter(x: number) {
  const t = (x - terraces[0].x) / (terraces[1].x - terraces[0].x)
  return lerp(terraces[0].z, terraces[1].z, t) + 0.33 * Math.sin(Math.PI * t)
}

function trailMask(x: number, z: number) {
  const ends = smoothstep(x, -2.75, -2.35) * (1 - smoothstep(x, 3.35, 3.95))
  return ends * (1 - smoothstep(Math.abs(z - trailCenter(x)), 0.115, 0.24))
}

function summitRadius(x: number, z: number) {
  const dx = (x + 0.78 + 0.1 * (z + 1.35)) / 2.65
  const dz = (z + 1.35) / 2.3
  return (Math.abs(dx) ** 3.1 + Math.abs(dz) ** 3.1) ** (1 / 3.1)
}

function terrainHeight(x: number, z: number) {
  const broad = noise(x * 0.85 + 9, z * 0.85)
  const grain = noise(x * 3.8, z * 3.8)
  const radius = summitRadius(x, z)
  const angle = Math.atan2(z + 1.35, x + 0.78)
  const gullies = Math.sin(angle * 9 + grain * 1.4) * Math.sin(Math.min(radius, 1) * Math.PI)
  const face = Math.max(0, 1 - radius ** 1.27)
  const layers = Math.sin(face * 52 + x * 1.35 + grain * 1.1)
  const summit = face * 3.04 + face * (0.105 * layers + 0.18 * gullies + 0.18 * (broad - 0.5))

  let range = 0
  for (const [px, pz, height, width, depth] of ridges) {
    const distance = Math.hypot((x - px) / width, (z - pz) / depth)
    const ridge = Math.max(0, 1 - distance * (1 + 0.37 * (broad - 0.5)))
    range = Math.max(range, height * ridge ** 1.12)
  }

  let y = -0.22 + Math.max(summit, range) + 0.32 * broad + 0.12 * grain
  y = lerp(y, lerp(0.24, 0.08, smoothstep(x, terraces[0].x, terraces[1].x)), trailMask(x, z))
  for (const terrace of terraces) {
    const distance = Math.hypot((x - terrace.x) / terrace.width, (z - terrace.z) / terrace.depth)
    y = lerp(y, terrace.y, 1 - smoothstep(distance, 0.8, 1.55))
  }
  return y
}

function createJourneyPath() {
  const destinations = resolveDestinations(terrainHeight)
  const controls = JOURNEY_PATH_WAYPOINTS.map(([x, z]) => new Vector3(x, terrainHeight(x, z), z))
  const guide = new CatmullRomCurve3(controls, false, 'centripetal', 0.45)
  const samples = Array.from({ length: 241 }, (_, index) => {
    const point = guide.getPoint(index / 240)
    point.y = terrainHeight(point.x, point.z) + 0.035
    return point
  })
  const positions: number[] = []
  const edgePositions: number[] = []
  const indices: number[] = []
  const edgeIndices: number[] = []
  const width = 0.21
  samples.forEach((point, index) => {
    const previous = samples[Math.max(0, index - 1)]
    const next = samples[Math.min(samples.length - 1, index + 1)]
    const dx = next.x - previous.x
    const dz = next.z - previous.z
    const length = Math.hypot(dx, dz) || 1
    const nx = -dz / length * width
    const nz = dx / length * width
    positions.push(point.x + nx, terrainHeight(point.x + nx, point.z + nz) + 0.035, point.z + nz)
    positions.push(point.x - nx, terrainHeight(point.x - nx, point.z - nz) + 0.035, point.z - nz)
    const ex = -dz / length * 0.3
    const ez = dx / length * 0.3
    edgePositions.push(
      point.x + ex, terrainHeight(point.x + ex, point.z + ez) + 0.045, point.z + ez,
      point.x + nx, terrainHeight(point.x + nx, point.z + nz) + 0.045, point.z + nz,
      point.x - nx, terrainHeight(point.x - nx, point.z - nz) + 0.045, point.z - nz,
      point.x - ex, terrainHeight(point.x - ex, point.z - ez) + 0.045, point.z - ez,
    )
    if (index < samples.length - 1) {
      const base = index * 2
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1)
      const edgeBase = index * 4
      edgeIndices.push(
        edgeBase, edgeBase + 4, edgeBase + 1, edgeBase + 4, edgeBase + 5, edgeBase + 1,
        edgeBase + 2, edgeBase + 6, edgeBase + 3, edgeBase + 6, edgeBase + 7, edgeBase + 3,
      )
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const edgeGeometry = new BufferGeometry()
  edgeGeometry.setAttribute('position', new Float32BufferAttribute(edgePositions, 3))
  edgeGeometry.setIndex(edgeIndices)
  edgeGeometry.computeVertexNormals()
  const journeyStops = destinations.map((destination) => {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    samples.forEach((point, index) => {
      const distance = Math.hypot(point.x - destination.position[0], point.z - destination.position[2])
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    return { ...destination, pathProgress: nearestIndex / (samples.length - 1) }
  })
  return { geometry, edgeGeometry, walkingPath: samples.map(({ x, y, z }) => [x, y, z] as [number, number, number]), destinations: journeyStops }
}

function createOuterTerrain() {
  return new CircleGeometry(120, 128).rotateX(-Math.PI / 2)
}

function createTerrain() {
  // An indexed heightfield keeps the whole landscape to one draw call and about 62,000 triangles.
  const geometry = new PlaneGeometry(17, 17, 176, 176).rotateX(-Math.PI / 2)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const slate = new Color('#4e555d')
  const rock = new Color('#87837d')
  const snow = new Color('#f1f5f9')
  const gravel = new Color('#a49582')
  const color = new Color()

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i)
    const edgeBlend = smoothstep(Math.max(Math.abs(x), Math.abs(z)), 6.9, 8.45)
    positions.setY(i, lerp(terrainHeight(x, z), -0.52, edgeBlend))
  }
  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const z = positions.getZ(i)
    const y = positions.getY(i)
    const grain = noise(x * 7, z * 7)
    const strata = Math.sin(y * 18 - x * 1.3 + noise(x * 2, z * 2) * 2)
    const slope = normals.getY(i)
    const snowLine = -0.42 + 0.28 * noise(x * 1.3, z * 1.3) + (1 - slope) * 0.34
    const exposedBand = (1 - smoothstep(strata, -0.95, -0.42)) * (1 - smoothstep(y, 2.2, 2.85))
    const snowCover = Math.max(0.78, smoothstep(y - snowLine + 0.12 * strata, -0.24, 0.14)) * (1 - 0.18 * exposedBand)
    const trail = trailMask(x, z + 0.075 * (grain - 0.5))
    let terraceClear = 0
    for (const terrace of terraces) {
      const distance = Math.hypot((x - terrace.x) / terrace.width, (z - terrace.z) / terrace.depth)
      terraceClear = Math.max(terraceClear, 1 - smoothstep(distance, 0.82, 1.45))
    }
    const clearArea = Math.max(trail, terraceClear)
    color.copy(slate)
      .lerp(rock, MathUtils.clamp(0.42 + strata * 0.24 + grain * 0.31, 0, 1))
      .lerp(snow, snowCover)
      .lerp(gravel, clearArea * 0.93)
      .multiplyScalar(0.81 + grain * 0.29)
    color.toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  return geometry
}

function createRockTexture() {
  const size = 128
  const pixels = new Uint8Array(size * size * 4)
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const grain = 0.7 * noise(x * 0.24, z * 0.24) + 0.3 * hash(x, z)
      const offset = (z * size + x) * 4
      pixels.fill(Math.round(grain * 255), offset, offset + 3)
      pixels[offset + 3] = 255
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(9, 9)
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

export default function KailashMountain() {
  const terrain = useMemo(createTerrain, [])
  const rockTexture = useMemo(createRockTexture, [])
  const journey = useMemo(createJourneyPath, [])
  const outerTerrain = useMemo(createOuterTerrain, [])

  useEffect(() => () => {
    terrain.dispose()
    rockTexture.dispose()
    journey.geometry.dispose()
    journey.edgeGeometry.dispose()
    outerTerrain.dispose()
  }, [terrain, rockTexture, journey, outerTerrain])

  return (
    <>
    <mesh geometry={outerTerrain} position={[0, -0.52, 0]} receiveShadow>
      <meshStandardMaterial color="#e7edf4" roughness={1} />
    </mesh>
    <group name="kailash-mountain" userData={{ walkingPath: journey.walkingPath, journeyStops: journey.destinations }}>
      <mesh geometry={terrain} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.96} bumpMap={rockTexture} bumpScale={0.035} />
      </mesh>
      <mesh geometry={journey.geometry} receiveShadow>
        <meshStandardMaterial color="#9d8d79" roughness={0.98} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={journey.edgeGeometry} receiveShadow>
        <meshStandardMaterial color="#eef4f8" roughness={1} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {journey.walkingPath.filter((_, index) => index % 12 === 4).map(([x, y, z], index) => (
        <mesh key={index} position={[x, y + 0.035, z]} rotation={[0, index * 1.37, 0]} scale={[1.25, 0.28, 0.8]} receiveShadow>
          <dodecahedronGeometry args={[0.105, 0]} />
          <meshStandardMaterial color={index % 3 === 0 ? '#817568' : '#a39787'} roughness={1} />
        </mesh>
      ))}
      <PortfolioDestinations destinations={journey.destinations} />
      {terraces.map(({ name, x, y, z }) => <group key={name} name={name} position={[x, y, z]} />)}
    </group>
    </>
  )
}
