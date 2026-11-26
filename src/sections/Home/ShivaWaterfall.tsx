import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending, BufferGeometry, CatmullRomCurve3, Float32BufferAttribute,
  NormalBlending, Raycaster, ShaderMaterial, TubeGeometry, Vector3, type MeshBasicMaterial,
} from 'three'
import { useDayNight } from './DayNightController'

type Props = { reveal: MutableRefObject<number>; origin: [number, number, number] }

const vertexShader = /* glsl */ `
  varying vec2 flowUv;
  varying vec3 worldNormal;
  varying vec3 worldPoint;
  void main() {
    flowUv = uv;
    worldNormal = normalize(mat3(modelMatrix) * normal);
    worldPoint = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPoint, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float time;
  uniform float reveal;
  uniform float night;
  varying vec2 flowUv;
  varying vec3 worldNormal;
  varying vec3 worldPoint;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - worldPoint);
    float fresnel = pow(1.0 - abs(dot(viewDirection, worldNormal)), 2.4);
    float ripple = 0.5 + 0.5 * sin(flowUv.y * 24.0 - time * 5.2 + sin(flowUv.x * 10.0));
    float sparkle = pow(max(0.0, ripple), 10.0) * (1.0 - night);
    vec3 dayColor = vec3(0.05, 0.64, 0.78);
    vec3 nightColor = vec3(0.12, 0.84, 1.0);
    vec3 color = mix(dayColor, nightColor, night) + fresnel * vec3(0.28, 0.72, 0.8) + sparkle * 0.38;
    gl_FragColor = vec4(color, reveal * (0.56 + fresnel * 0.28 + night * 0.1));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const foamVertex = /* glsl */ `
  uniform float time;
  uniform float reveal;
  uniform float pointScale;
  attribute vec3 motion;
  varying float alpha;
  void main() {
    float life = mod(time * motion.z + motion.y, 1.0);
    vec3 p = position;
    p.x += cos(motion.x) * life * 0.42;
    p.z += sin(motion.x) * life * 0.42;
    p.y += sin(life * 3.14159) * 0.15;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(pointScale / max(1.0, -mv.z), 1.0, 6.0);
    alpha = reveal * (1.0 - life) * 0.62;
  }
`

const foamFragment = /* glsl */ `
  uniform float night;
  varying float alpha;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    float soft = 1.0 - smoothstep(0.08, 0.5, radius);
    if (soft < 0.01) discard;
    gl_FragColor = vec4(mix(vec3(0.72, 0.95, 1.0), vec3(0.3, 0.9, 1.0), night), alpha * soft);
  }
`

function createFoam(points: Vector3[]) {
  const count = 110
  const positions = new Float32Array(count * 3)
  const motion = new Float32Array(count * 3)
  let seed = 713
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
  for (let i = 0; i < count; i++) {
    const anchor = points[i % points.length]
    positions.set([anchor.x + (random() - 0.5) * 0.22, anchor.y + random() * 0.08, anchor.z + (random() - 0.5) * 0.22], i * 3)
    motion.set([random() * Math.PI * 2, random(), 0.25 + random() * 0.35], i * 3)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('motion', new Float32BufferAttribute(motion, 3))
  return geometry
}

export default function ShivaWaterfall({ reveal, origin: [ox, oy, oz] }: Props) {
  const cycle = useDayNight()
  const scene = useThree((state) => state.scene)
  const water = useRef<ShaderMaterial>(null)
  const foam = useRef<ShaderMaterial>(null)
  const mist = useRef<MeshBasicMaterial>(null)
  const upperRoute = useMemo(() => [
    new Vector3(ox - 0.05, oy + 8.15, oz - 0.38),
    new Vector3(ox - 0.38, oy + 7.45, oz - 0.62),
    new Vector3(ox - 0.72, oy + 6.25, oz - 0.82),
    new Vector3(ox - 1.12, oy + 4.35, oz - 0.76),
    new Vector3(ox - 1.28, oy + 2.25, oz - 0.35),
  ], [ox, oy, oz])
  const fallbackRiver = useMemo(() => new CatmullRomCurve3([
    new Vector3(ox - 1.18, oy + 0.7, oz + 0.72),
    new Vector3(ox - 0.75, oy + 0.42, oz + 1.65),
    new Vector3(ox + 0.15, oy + 0.25, oz + 2.8),
    new Vector3(ox + 1.35, oy + 0.08, oz + 3.85),
    new Vector3(ox + 2.55, oy - 0.1, oz + 4.9),
    new Vector3(ox + 3.65, oy - 0.3, oz + 5.8),
  ]), [ox, oy, oz])
  const [riverRoute, setRiverRoute] = useState(fallbackRiver)

  useLayoutEffect(() => {
    const mountain = scene.getObjectByName('kailash-mountain')
    if (!mountain) return
    const xz = [
      [ox - 1.18, oz + 0.72], [ox - 0.75, oz + 1.65], [ox + 0.15, oz + 2.8],
      [ox + 1.35, oz + 3.85], [ox + 2.55, oz + 4.9], [ox + 3.65, oz + 5.8],
    ]
    const raycaster = new Raycaster()
    const heights = xz.map(([x, z]) => {
      raycaster.set(new Vector3(x, 20, z), new Vector3(0, -1, 0))
      return (raycaster.intersectObject(mountain, true)[0]?.point.y ?? 0) + 0.09
    })
    for (let i = heights.length - 2; i >= 0; i--) heights[i] = Math.max(heights[i], heights[i + 1] + 0.035)
    setRiverRoute(new CatmullRomCurve3(xz.map(([x, z], i) => new Vector3(x, heights[i], z))))
  }, [ox, oz, scene])

  const route = useMemo(() => new CatmullRomCurve3([...upperRoute, riverRoute.points[0].clone()]), [riverRoute, upperRoute])
  const cascade = useMemo(() => new TubeGeometry(route, 104, 0.16, 10, false), [route])
  const river = useMemo(() => new TubeGeometry(riverRoute, 72, 0.24, 10, false), [riverRoute])
  const impactPoints = useMemo(() => [route.getPoint(0.68), route.getPoint(0.98), riverRoute.getPoint(0.5)], [riverRoute, route])
  const foamGeometry = useMemo(() => createFoam(impactPoints), [impactPoints])
  const uniforms = useMemo(() => ({ time: { value: 0 }, reveal: { value: 0 }, night: { value: 0 } }), [])
  const foamUniforms = useMemo(() => ({ time: { value: 0 }, reveal: { value: 0 }, night: { value: 0 }, pointScale: { value: 38 } }), [])

  useEffect(() => () => { cascade.dispose(); river.dispose(); foamGeometry.dispose() }, [cascade, foamGeometry, river])

  useFrame((_, delta) => {
    const visible = Math.max(0, Math.min(1, (reveal.current - 0.42) / 0.5))
    uniforms.time.value += delta
    uniforms.reveal.value = visible
    uniforms.night.value = cycle.current.night
    foamUniforms.time.value += delta
    foamUniforms.reveal.value = visible
    foamUniforms.night.value = cycle.current.night
    if (mist.current) mist.current.opacity = visible * (0.06 + cycle.current.night * 0.08)
  })

  return (
    <group name="ganga-waterfall">
      {[cascade, river].map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <shaderMaterial ref={index === 0 ? water : undefined} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={NormalBlending} />
        </mesh>
      ))}
      <points geometry={foamGeometry} frustumCulled={false}>
        <shaderMaterial ref={foam} uniforms={foamUniforms} vertexShader={foamVertex} fragmentShader={foamFragment} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
      <mesh position={impactPoints[1]} scale={[1.8, 0.32, 1]}>
        <sphereGeometry args={[0.38, 14, 8]} />
        <meshBasicMaterial ref={mist} color="#83e9ff" transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}
