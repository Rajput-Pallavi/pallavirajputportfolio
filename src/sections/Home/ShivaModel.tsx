import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  Box3, Color, MathUtils, Mesh, MeshStandardMaterial,
  MeshBasicMaterial, Object3D, Vector3, type Group, type InstancedMesh,
  type Material, type PointLight,
} from 'three'
import { useDayNight } from './DayNightController'
import ShivaWaterfall from './ShivaWaterfall'

const modelUrl = '/models/shiva.optimized.glb'
const worldPosition: [number, number, number] = [-0.75, -0.85, -4.7]
const targetHeight = 8
const cloudCount = 18
const nightAura = new Color('#8cbcff')
const twilightAura = new Color('#ffd39a')
const skinTint = new Color('#86a7bd')

export type ShivaModelProps = {
  /** 0 = distant, 1 = Pallavi has reached the prayer location. */
  proximity?: number
}

export default function ShivaModel({ proximity = 0 }: ShivaModelProps) {
  const { scene } = useGLTF(modelUrl, false, true)
  const dayNight = useDayNight()
  const targetProximity = MathUtils.clamp(proximity, 0, 1)
  const reveal = useRef<Group>(null)
  const modelGroup = useRef<Group>(null)
  const clouds = useRef<InstancedMesh>(null)
  const cloudMaterial = useRef<MeshBasicMaterial>(null)
  const auraLight = useRef<PointLight>(null)
  const divineLight = useRef<PointLight>(null)
  const progress = useRef(0)
  const waterfallReveal = useRef(0)
  const elapsed = useRef(0)
  const reducedMotion = useRef(false)
  const isSolid = useRef(false)
  const cloudTransform = useMemo(() => new Object3D(), [])

  const { model, materials, offset, size, giantScale } = useMemo(() => {
    const copy = scene.clone(true)
    const tracked: Array<{ material: Material; opacity: number }> = []
    copy.traverse((child) => {
      if (!(child instanceof Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const source = Array.isArray(child.material) ? child.material : [child.material]
      const cloned = source.map((material) => {
        const next = material.clone()
        if (next instanceof MeshStandardMaterial) {
          const materialName = `${child.name} ${next.name}`.toLowerCase()
          next.roughness = MathUtils.clamp(next.roughness, 0.48, 0.82)
          next.metalness = /trishul|jewel|ornament|metal/.test(materialName) ? 0.58 : Math.min(next.metalness, 0.12)
          if (/skin|body|face|shiva/.test(materialName)) next.color.lerp(skinTint, 0.22)
          next.envMapIntensity = 0.8
        }
        tracked.push({ material: next, opacity: next.opacity })
        next.transparent = true
        next.depthWrite = false
        next.opacity = 0
        return next
      })
      child.material = Array.isArray(child.material) ? cloned : cloned[0]
    })
    const bounds = new Box3().setFromObject(copy)
    const dimensions = bounds.getSize(new Vector3())
    const center = bounds.getCenter(new Vector3())
    return {
      model: copy,
      materials: tracked,
      offset: new Vector3(-center.x, -bounds.min.y, -center.z),
      size: dimensions,
      giantScale: targetHeight / Math.max(dimensions.y, 0.001),
    }
  }, [scene])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { reducedMotion.current = preference.matches }
    update()
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])

  useEffect(() => () => materials.forEach(({ material }) => material.dispose()), [materials])

  useFrame((_, delta) => {
    if (!reveal.current || !modelGroup.current) return
    const target = MathUtils.smoothstep(targetProximity, 0.18, 1)
    progress.current = reducedMotion.current ? target : MathUtils.damp(progress.current, target, 1.8, delta)
    const value = progress.current
    const modelOpacity = MathUtils.smoothstep(value, 0.08, 0.82)
    waterfallReveal.current = value
    const cloudFade = Math.sin(Math.PI * value)
    const cycle = dayNight.current
    elapsed.current += delta

    modelGroup.current.visible = value > 0.002
    const solid = value > 0.995
    if (solid !== isSolid.current) {
      isSolid.current = solid
      materials.forEach(({ material, opacity }) => {
        material.transparent = !solid
        material.depthWrite = solid
        material.opacity = solid ? opacity : opacity * modelOpacity
        material.needsUpdate = true
      })
    } else if (!solid) {
      materials.forEach(({ material, opacity }) => { material.opacity = opacity * modelOpacity })
    }
    reveal.current.position.y = MathUtils.lerp(-0.32, 0, value)
    reveal.current.scale.setScalar(giantScale * MathUtils.lerp(0.94, 1, value))

    if (auraLight.current) {
      auraLight.current.color.copy(nightAura).lerp(twilightAura, cycle.twilight * 0.25)
      auraLight.current.intensity = value * (0.28 + cycle.night * 1.35)
    }
    if (divineLight.current) divineLight.current.intensity = value * (1.2 + cycle.night * 2.1 + cycle.twilight * 0.8)
    if (cloudMaterial.current) {
      cloudMaterial.current.color.copy(cycle.snowColor)
      cloudMaterial.current.opacity = cloudFade * 0.38 * cycle.cloudLight
    }
    if (clouds.current) {
      clouds.current.visible = value > 0.002 && value < 0.998
      for (let i = 0; i < cloudCount; i++) {
        const angle = (i / cloudCount) * Math.PI * 2 + elapsed.current * 0.14 + i * 0.31
        const distance = size.x * (0.42 + value * 0.5 + (i % 3) * 0.07)
        cloudTransform.position.set(
          Math.cos(angle) * distance,
          size.y * (0.18 + (i % 5) * 0.1 + value * 0.12),
          Math.sin(angle) * distance * 0.42,
        )
        const cloudSize = size.x * (0.18 + (i % 3) * 0.035)
        cloudTransform.scale.set(cloudSize * 1.8, cloudSize * 0.58, cloudSize)
        cloudTransform.rotation.y = angle
        cloudTransform.updateMatrix()
        clouds.current.setMatrixAt(i, cloudTransform.matrix)
      }
      clouds.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <>
    <ShivaWaterfall reveal={waterfallReveal} origin={worldPosition} />
    <group name="shivji" position={worldPosition}>
      <group ref={reveal} scale={giantScale}>
        <group ref={modelGroup} visible={false} position={offset}><primitive object={model} /></group>
        <pointLight ref={auraLight} position={[0, size.y * 0.55, 0]} color="#8cbcff" intensity={0} distance={10} decay={2} />
        <pointLight ref={divineLight} position={[0, size.y * 0.65, 0.3]} color="#ffd293" intensity={0} distance={18} decay={2} />
        <instancedMesh ref={clouds} args={[undefined, undefined, cloudCount]} visible={false} frustumCulled={false}>
          <sphereGeometry args={[1, 10, 7]} />
          <meshBasicMaterial ref={cloudMaterial} color="#dcebf4" transparent opacity={0} depthWrite={false} />
        </instancedMesh>
      </group>
    </group>
    </>
  )
}

useGLTF.preload(modelUrl, false, true)
