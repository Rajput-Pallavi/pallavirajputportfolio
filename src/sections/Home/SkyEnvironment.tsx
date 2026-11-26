import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BackSide, Color, DataTexture, LinearFilter, LinearMipmapLinearFilter,
  MathUtils, RGBAFormat, SRGBColorSpace, Sprite, Vector3,
  type DirectionalLight, type FogExp2, type Group, type HemisphereLight,
} from 'three'
import { useDayNight } from './DayNightController'

const warmSun = new Color('#ffd0a0')
const daylightSun = new Color('#fff1d2')
const moonlightColor = new Color('#9bbcff')

const skyVertex = /* glsl */ `
  varying vec3 worldPosition;

  void main() {
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFragment = /* glsl */ `
  uniform vec3 sunPosition;
  uniform vec3 moonPosition;
  uniform vec3 upperColor;
  uniform vec3 horizonColor;
  uniform float daylight;
  uniform float twilight;
  uniform float night;
  uniform float time;
  varying vec3 worldPosition;

  void main() {
    vec3 ray = normalize(worldPosition - cameraPosition);
    vec3 sun = normalize(sunPosition);
    vec3 moon = normalize(moonPosition);
    float elevation = clamp((ray.y + 0.12) / 0.85, 0.0, 1.0);
    vec3 color = mix(horizonColor, upperColor, pow(elevation, 0.55));

    float separation = length(ray - sun);
    float glow = exp(-separation * separation * 9.0);
    float nightSwitch = smoothstep(0.15, 0.55, night);
    float sunVisibility = clamp(daylight + twilight, 0.0, 1.0) * (1.0 - nightSwitch);
    color = mix(color, vec3(1.0, 0.62, 0.32), glow * sunVisibility * (0.22 + twilight * 0.55));
    color += vec3(0.62, 0.32, 0.10) * exp(-separation * 11.0) * sunVisibility;

    // Soft radial streaks share the sky pass and remain behind the terrain.
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), sun));
    vec3 up = cross(sun, right);
    float angle = atan(dot(ray, up), dot(ray, right) + 0.0001);
    float streaks = pow(0.5 + 0.5 * sin(angle * 13.0 + sin(angle * 5.0)), 6.0);
    float rays = streaks * smoothstep(0.02, 0.09, separation) * exp(-separation * 5.0);
    color += vec3(0.29, 0.16, 0.07) * rays * twilight;

    float disk = 1.0 - smoothstep(0.021, 0.029, separation);
    color += disk * vec3(2.6, 1.55, 0.63) * sunVisibility;
    float moonDistance = length(ray - moon);
    float moonDisk = 1.0 - smoothstep(0.025, 0.034, moonDistance);
    float moonGlow = exp(-moonDistance * moonDistance * 18.0);
    color += vec3(0.25, 0.36, 0.62) * moonGlow * nightSwitch * 0.45;
    color += moonDisk * vec3(0.72, 0.82, 1.0) * nightSwitch * 1.35;

    vec3 starCell = floor(ray * 430.0);
    float starNoise = fract(sin(dot(starCell, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    float stars = step(0.9947, starNoise) * smoothstep(-0.03, 0.25, ray.y) * night;
    float twinkle = 0.72 + 0.28 * sin(time * (0.7 + starNoise) + starNoise * 31.0);
    color += vec3(0.76, 0.86, 1.0) * stars * twinkle * (0.55 + starNoise);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const cloudBanks = [
  { center: [-4.2, 1.75, -2.5], phase: 0.4, size: 1.15, opacity: 0.62 },
  { center: [2.9, 1.82, -2.4], phase: 2.5, size: 1, opacity: 0.56 },
  { center: [-2.4, 3.05, -5.9], phase: 4.5, size: 1.25, opacity: 0.46 },
] as const

// Offset billboards through the bank in all three axes to create parallax.
const cloudPuffs = [
  [-0.8, -0.05, -0.26, 1.45, 0.58],
  [-0.25, 0.12, 0.12, 1.7, 0.8],
  [0.33, 0.02, -0.18, 1.8, 0.68],
  [0.87, -0.12, 0.2, 1.55, 0.5],
] as const

const cloudLobes = [
  [-0.48, 0.02, 0.38, 0.48],
  [-0.16, 0.14, 0.43, 0.66],
  [0.17, 0.21, 0.37, 0.69],
  [0.48, -0.04, 0.39, 0.46],
] as const

function createCloudTexture() {
  const size = 128
  const pixels = new Uint8Array(size * size * 4)
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      const x = (column / (size - 1)) * 2 - 1
      const y = (row / (size - 1)) * 2 - 1
      const ripple = Math.sin(x * 17 + y * 7) * Math.sin(y * 19 - x * 8) * 0.09
      let density = 0
      for (const [cx, cy, rx, ry] of cloudLobes) {
        const radius = Math.hypot((x - cx) / rx, (y - cy) / ry)
        density = Math.max(density, 1 - MathUtils.smoothstep(radius + ripple, 0.2, 1.18))
      }
      const edge = 1 - MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(y)), 0.82, 1)
      const shade = MathUtils.smoothstep(y + ripple, -0.59, 0.61)
      const i = (row * size + column) * 4
      pixels[i] = MathUtils.lerp(170, 255, shade)
      pixels[i + 1] = MathUtils.lerp(179, 243, shade)
      pixels[i + 2] = MathUtils.lerp(198, 223, shade)
      pixels[i + 3] = density * edge * 255
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

export default function SkyEnvironment() {
  const dayNight = useDayNight()
  const texture = useMemo(createCloudTexture, [])
  const uniforms = useMemo(() => ({
    sunPosition: { value: new Vector3() },
    moonPosition: { value: new Vector3() },
    upperColor: { value: new Color() },
    horizonColor: { value: new Color() },
    daylight: { value: 1 },
    twilight: { value: 0 },
    night: { value: 0 },
    time: { value: 0 },
  }), [])
  const clouds = useRef<Group>(null)
  const sunlight = useRef<DirectionalLight>(null)
  const moonlight = useRef<DirectionalLight>(null)
  const hemisphere = useRef<HemisphereLight>(null)
  const fog = useRef<FogExp2>(null)
  const elapsed = useRef(0)
  const shadowHour = useRef(-1)
  const reducedMotion = useRef(false)
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    sunlight.current?.shadow.camera.updateProjectionMatrix()
  }, [])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined
    const updateMotion = () => {
      window.clearInterval(timer)
      reducedMotion.current = preference.matches
      if (!preference.matches) timer = window.setInterval(invalidate, 1000 / 30)
    }

    updateMotion()
    preference.addEventListener('change', updateMotion)
    return () => {
      window.clearInterval(timer)
      preference.removeEventListener('change', updateMotion)
    }
  }, [invalidate])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    const cycle = dayNight.current
    uniforms.sunPosition.value.copy(cycle.sunPosition)
    uniforms.moonPosition.value.copy(cycle.moonPosition)
    uniforms.upperColor.value.copy(cycle.upperSky)
    uniforms.horizonColor.value.copy(cycle.horizonSky)
    uniforms.daylight.value = cycle.daylight
    uniforms.twilight.value = cycle.twilight
    uniforms.night.value = cycle.night
    uniforms.time.value = elapsed.current

    if (sunlight.current) {
      sunlight.current.position.copy(cycle.sunPosition)
      sunlight.current.color.copy(daylightSun).lerp(warmSun, cycle.twilight)
      sunlight.current.intensity = cycle.daylight * 2.65 + cycle.twilight * 0.55
      if (Math.abs(cycle.hour - shadowHour.current) > 0.04) {
        sunlight.current.shadow.needsUpdate = true
        shadowHour.current = cycle.hour
      }
    }
    if (moonlight.current) {
      moonlight.current.position.copy(cycle.moonPosition)
      moonlight.current.intensity = cycle.night * 1.18
    }
    if (hemisphere.current) {
      hemisphere.current.intensity = 0.48 + cycle.daylight * 1.08
      hemisphere.current.color.copy(cycle.upperSky).lerp(daylightSun, 0.25)
    }
    if (fog.current) {
      fog.current.color.copy(cycle.fogColor)
      fog.current.density = 0.025 + cycle.night * 0.007 + cycle.twilight * 0.003
    }

    if (!clouds.current) return
    if (!reducedMotion.current) elapsed.current += delta
    clouds.current.children.forEach((bank, i) => {
      const { center, phase, opacity } = cloudBanks[i]
      if (!reducedMotion.current) {
        bank.position.x = center[0] + 0.48 * (Math.sin(elapsed.current * 0.15 + phase) - Math.sin(phase))
        bank.position.z = center[2] + 0.17 * Math.sin(elapsed.current * 0.10)
      }
      bank.children.forEach((puff) => {
        if (puff instanceof Sprite) {
          puff.material.opacity = opacity * cycle.cloudLight
          puff.material.color.copy(cycle.snowColor)
        }
      })
    })
  })

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={['#cbbfbb', 0.03]} />
      <hemisphereLight ref={hemisphere} args={['#dbe8ff', '#283447', 1.56]} />
      <directionalLight
        ref={sunlight}
        position={[-4.5, 5.5, -9]}
        color="#ffd3a0"
        intensity={2.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-far={28}
        shadow-normalBias={0.035}
        shadow-autoUpdate={false}
        shadow-needsUpdate
      />
      <directionalLight ref={moonlight} position={[4, 6, 8]} color={moonlightColor} intensity={0} />
      <mesh renderOrder={-1}>
        <sphereGeometry args={[45, 32, 16]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
        />
      </mesh>
      <group ref={clouds} name="cloud-banks">
        {cloudBanks.map(({ center, size, phase, opacity }) => (
          <group key={phase} position={[...center]} scale={size}>
            {cloudPuffs.map(([x, y, z, width, height]) => (
              <sprite key={x} position={[x, y, z]} scale={[width, height, 1]}>
                <spriteMaterial map={texture} opacity={opacity} depthWrite={false} transparent />
              </sprite>
            ))}
          </group>
        ))}
      </group>
    </>
  )
}
