import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BufferGeometry, Color, Float32BufferAttribute, UniformsLib, UniformsUtils, type Points, type ShaderMaterial,
} from 'three'
import { useDayNight } from './DayNightController'

const desktopCount = 1900
const mobileCount = 680

// Advance static GPU attributes with a single time uniform. No per-frame buffer uploads.
const vertexShader = /* glsl */ `
  uniform float time;
  uniform float pixelScale;
  uniform float pixelRatio;
  attribute vec4 flake;
  varying float opacity;
  #include <fog_pars_vertex>

  void main() {
    float phase = flake.z;
    vec3 p = position;
    p.y = mod(p.y - time * flake.y, 8.8);
    p.x += time * 0.09 + 0.22 * sin(phase + time * 0.72 + p.y * 0.5);
    p.z += 0.17 * cos(phase + time * 0.53 + p.y * 0.35);
    p.xz = mod(p.xz + 10.0, 20.0) - 10.0;

    float verticalFade = smoothstep(0.0, 0.75, p.y) * (1.0 - smoothstep(7.8, 8.8, p.y));
    float edgeFade = 1.0 - smoothstep(8.7, 10.0, max(abs(p.x), abs(p.z)));
    p.y -= 0.8;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    opacity = flake.w * verticalFade * edgeFade * smoothstep(0.35, 1.65, -mvPosition.z);
    gl_PointSize = clamp(flake.x * pixelScale / max(0.35, -mvPosition.z), 1.0, 7.0 * pixelRatio);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 snowColor;
  varying float opacity;
  #include <fog_pars_fragment>

  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    float alpha = opacity * (1.0 - smoothstep(0.13, 0.5, radius));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(snowColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

function createSnowGeometry() {
  const positions = new Float32Array(desktopCount * 3)
  const flakes = new Float32Array(desktopCount * 4)
  let seed = 421
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }

  for (let i = 0; i < desktopCount; i++) {
    positions[i * 3] = random() * 20 - 10
    positions[i * 3 + 1] = random() * 8.8
    positions[i * 3 + 2] = random() * 20 - 10
    flakes[i * 4] = 0.024 + random() ** 1.6 * 0.048
    flakes[i * 4 + 1] = 0.18 + random() * 0.34
    flakes[i * 4 + 2] = random() * Math.PI * 2
    flakes[i * 4 + 3] = 0.38 + random() * 0.44
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('flake', new Float32BufferAttribute(flakes, 4))
  return geometry
}

export default function SnowParticles() {
  const dayNight = useDayNight()
  const geometry = useMemo(createSnowGeometry, [])
  const points = useRef<Points>(null)
  const material = useRef<ShaderMaterial>(null)
  const invalidate = useThree((state) => state.invalidate)
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    pixelScale: { value: 1 },
    pixelRatio: { value: 1 },
    snowColor: { value: new Color('#f4f8ff') },
    ...UniformsUtils.clone(UniformsLib.fog),
  }), [])

  useLayoutEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const compact = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => {
      geometry.setDrawRange(0, compact.matches ? mobileCount : desktopCount)
      if (points.current) points.current.visible = !motion.matches
      invalidate()
    }

    update()
    motion.addEventListener('change', update)
    compact.addEventListener('change', update)
    return () => {
      motion.removeEventListener('change', update)
      compact.removeEventListener('change', update)
      geometry.dispose()
    }
  }, [geometry, invalidate])

  // Share the Home scene's existing weather render cadence in demand mode.
  useFrame(({ gl, size, camera }, delta) => {
    if (!points.current?.visible || !material.current) return
    const liveUniforms = material.current.uniforms
    const pixelRatio = gl.getPixelRatio()
    liveUniforms.time.value += delta
    liveUniforms.pixelRatio.value = pixelRatio
    liveUniforms.pixelScale.value = size.height * pixelRatio * camera.projectionMatrix.elements[5] * 0.5
    liveUniforms.snowColor.value.copy(dayNight.current.snowColor)
  })

  return (
    <points ref={points} name="snow-particles" geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        fog
      />
    </points>
  )
}
