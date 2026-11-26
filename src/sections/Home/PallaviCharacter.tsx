import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Bone, Euler, MathUtils, Mesh, MeshStandardMaterial, Quaternion, Vector3, type Group, type Material, type MeshBasicMaterial, type Object3D, type PointLight } from 'three'

const modelUrl = '/models/pallavi.glb'

export default function PallaviCharacter() {
  const { scene, animations } = useGLTF(modelUrl)
  const group = useRef<Group>(null)
  const rootScene = useThree((state) => state.scene)
  const invalidate = useThree((state) => state.invalidate)
  const { actions } = useAnimations(animations, group)
  const phase = useRef(0)
  const walkBlend = useRef(0)
  const activeClip = useRef('')
  const bones = useRef<Record<string, Bone>>({})
  const rest = useRef<Record<string, Quaternion>>({})
  const prayerBlend = useRef(0)
  const waveBlend = useRef(0)
  const sitBlend = useRef(0)
  const shivaRevealed = useRef(false)
  const eyeParts = useRef<Object3D[]>([])
  const origin = useMemoVector()
  const target = useMemoVector()
  const direction = useMemoVector()
  const parentRotation = useRef(new Quaternion())
  const targetRotation = useRef(new Quaternion())
  const bowRotation = useRef(new Quaternion())
  const teleportAura = useRef<MeshBasicMaterial>(null)
  const teleportLight = useRef<PointLight>(null)
  const teleportMaterials = useRef<Array<{ material: Material; opacity: number; transparent: boolean; depthWrite: boolean }>>([])
  const lastTeleportOpacity = useRef(1)

  useLayoutEffect(() => {
    const start = rootScene.getObjectByName('kailash-mountain')?.userData.journeyStops?.[0]?.position
    if (group.current && start) group.current.position.set(start[0], start[1] + 0.03, start[2])
  }, [rootScene])

  useEffect(() => {
    const tracked = new Set<Material>()
    scene.traverse((child) => {
      if (child instanceof Bone) {
        bones.current[child.name] = child
        rest.current[child.name] = child.quaternion.clone()
      }
      if (child.name.startsWith('Eye.')) eyeParts.current.push(child)
      if (!(child instanceof Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      if (child.material instanceof MeshStandardMaterial) child.material.envMapIntensity = 0.8
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (tracked.has(material)) return
        tracked.add(material)
        teleportMaterials.current.push({ material, opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite })
      })
    })
  }, [scene])

  useFrame((_, delta) => {
    if (!group.current) return
    const teleportOpacity = group.current.userData.teleportOpacity ?? 1
    const teleportGlow = group.current.userData.teleportGlow ?? 0
    if (Math.abs(teleportOpacity - lastTeleportOpacity.current) > 0.001) {
      teleportMaterials.current.forEach(({ material, opacity, transparent, depthWrite }) => {
        const fading = teleportOpacity < 0.999
        if (material.transparent !== (fading || transparent)) material.needsUpdate = true
        material.transparent = fading || transparent
        material.depthWrite = fading ? false : depthWrite
        material.opacity = opacity * teleportOpacity
      })
      lastTeleportOpacity.current = teleportOpacity
    }
    if (teleportAura.current) teleportAura.current.opacity = teleportGlow * 0.22
    if (teleportLight.current) teleportLight.current.intensity = teleportGlow * 1.6
    const motion = group.current.userData.motion
    const moving = motion === 'walk'
    const praying = motion === 'prayer'
    const waving = motion === 'home-wave'
    const working = motion === 'work-type'
    const sitting = motion === 'about-sit' || working
    const viewingSkills = motion === 'skills-look'
    const readingDiary = motion === 'about-read'
    const viewingWork = motion === 'work-view'
    prayerBlend.current = MathUtils.damp(prayerBlend.current, praying ? 1 : 0, 5.2, delta)
    const prayer = prayerBlend.current

    if (prayer > 0.002 || motion === 'prayer-exit') {
      Object.values(actions).forEach((action) => action?.fadeOut(0.18))
      activeClip.current = ''
      group.current.updateWorldMatrix(true, true)
      const aim = (name: string, localTarget: [number, number, number]) => {
        const bone = bones.current[name]
        if (!bone?.parent || !rest.current[name]) return
        target.fromArray(localTarget)
        group.current!.localToWorld(target)
        bone.getWorldPosition(origin)
        direction.subVectors(target, origin).normalize()
        bone.parent!.getWorldQuaternion(parentRotation.current).invert()
        direction.applyQuaternion(parentRotation.current)
        targetRotation.current.setFromUnitVectors(new Vector3(0, 1, 0), direction)
        bone.quaternion.copy(rest.current[name]).slerp(targetRotation.current, prayer)
        bone.updateWorldMatrix(true, true)
      }
      aim('upper_arm.L', [0.2, -0.12, 0.92])
      aim('upper_arm.R', [-0.2, -0.12, 0.92])
      aim('forearm.L', [0.045, -0.29, 0.91])
      aim('forearm.R', [-0.045, -0.29, 0.91])
      const head = bones.current.head
      if (head && rest.current.head) {
        bowRotation.current.copy(rest.current.head).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.18))
        head.quaternion.copy(rest.current.head).slerp(bowRotation.current, prayer)
      }
      eyeParts.current.forEach((eye) => { eye.scale.z = MathUtils.lerp(1, 0.12, prayer) })
      group.current.scale.y = 1 + Math.sin(phase.current * 1.4) * 0.004 * prayer
      phase.current += delta
      if (prayer > 0.97 && !shivaRevealed.current) {
        shivaRevealed.current = true
        window.dispatchEvent(new Event('shiva:reveal'))
      }
      if (motion === 'prayer-exit' && prayer < 0.02) group.current.userData.prayerExitReady = true
      invalidate()
      return
    }

    group.current.scale.y = MathUtils.damp(group.current.scale.y, 1, 8, delta)
    eyeParts.current.forEach((eye) => { eye.scale.z = MathUtils.damp(eye.scale.z, 1, 10, delta) })
    waveBlend.current = MathUtils.damp(waveBlend.current, waving ? 1 : 0, 5, delta)
    if (waving) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.18))
      activeClip.current = ''
      const upper = bones.current['upper_arm.R']
      const forearm = bones.current['forearm.R']
      const hand = bones.current['hand.R']
      if (upper && rest.current['upper_arm.R']) upper.quaternion.copy(rest.current['upper_arm.R']).multiply(new Quaternion().setFromEuler(new Euler(-0.35, 0, -1.25)))
      if (forearm && rest.current['forearm.R']) forearm.quaternion.copy(rest.current['forearm.R']).multiply(new Quaternion().setFromEuler(new Euler(-0.2, 0, -1.15)))
      if (hand && rest.current['hand.R']) hand.quaternion.copy(rest.current['hand.R']).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.sin(phase.current * 4.2) * 0.38))
      phase.current += delta
      invalidate()
      return
    }
    ;['upper_arm.R', 'forearm.R', 'hand.R'].forEach((name) => {
      const bone = bones.current[name]
      if (bone && rest.current[name]) bone.quaternion.slerp(rest.current[name], 1 - Math.exp(-8 * delta))
    })
    if (readingDiary || viewingWork) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.18))
      activeClip.current = ''
      const pose = (name: string, x: number, z = 0) => {
        const bone = bones.current[name]
        if (bone && rest.current[name]) {
          targetRotation.current.copy(rest.current[name]).multiply(new Quaternion().setFromEuler(new Euler(x, 0, z)))
          bone.quaternion.slerp(targetRotation.current, 1 - Math.exp(-5 * delta))
        }
      }
      pose('head', readingDiary ? 0.16 : 0.05)
      if (readingDiary) { pose('upper_arm.L', -0.34, 0.14); pose('upper_arm.R', -0.34, -0.14); pose('forearm.L', -0.5); pose('forearm.R', -0.5) }
      phase.current += delta
      invalidate()
      return
    }
    sitBlend.current = MathUtils.damp(sitBlend.current, sitting ? 1 : 0, 4.5, delta)
    if (sitting) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.18))
      activeClip.current = ''
      const poseBone = (name: string, x: number, z = 0) => {
        const bone = bones.current[name]
        if (bone && rest.current[name]) {
          targetRotation.current.copy(rest.current[name]).multiply(new Quaternion().setFromEuler(new Euler(x, 0, z)))
          bone.quaternion.slerp(targetRotation.current, 1 - Math.exp(-6 * delta))
        }
      }
      poseBone('thigh.L', -1.18); poseBone('thigh.R', -1.18)
      poseBone('shin.L', 1.28); poseBone('shin.R', 1.28)
      poseBone('upper_arm.L', working ? -0.58 : -0.42, 0.18); poseBone('upper_arm.R', working ? -0.58 : -0.42, -0.18)
      poseBone('forearm.L', working ? -0.92 : -0.72); poseBone('forearm.R', working ? -0.92 : -0.72)
      poseBone('hand.L', working ? Math.sin(phase.current * 7) * 0.09 : 0)
      poseBone('hand.R', working ? Math.sin(phase.current * 7 + Math.PI) * 0.09 : 0)
      poseBone('head', working ? 0.1 : 0.14)
      const groundY = group.current.userData.groundY as number | undefined
      if (groundY !== undefined) group.current.position.y = MathUtils.damp(group.current.position.y, groundY - 0.22, 4.5, delta)
      phase.current += delta
      group.current.rotation.z = Math.sin(phase.current * 1.3) * 0.004
      invalidate()
      return
    }
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, 0, 8, delta)
    if (viewingSkills) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.18))
      activeClip.current = ''
      const head = bones.current.head
      if (head && rest.current.head) {
        targetRotation.current.copy(rest.current.head).multiply(new Quaternion().setFromEuler(new Euler(0.24, 0, 0)))
        head.quaternion.slerp(targetRotation.current, 1 - Math.exp(-5 * delta))
      }
      phase.current += delta
      invalidate()
      return
    }
    ;['thigh.L', 'thigh.R', 'shin.L', 'shin.R', 'upper_arm.L', 'upper_arm.R', 'forearm.L', 'forearm.R', 'head'].forEach((name) => {
      const bone = bones.current[name]
      if (bone && rest.current[name]) bone.quaternion.slerp(rest.current[name], 1 - Math.exp(-7 * delta))
    })
    const clipName = moving ? 'walk' : 'idle'
    const clip = Object.entries(actions).find(([name]) => name.toLowerCase().includes(clipName))?.[1]
    if (clip && activeClip.current !== clipName) {
      Object.values(actions).forEach((action) => action?.fadeOut(0.2))
      clip.reset().fadeIn(0.2).play()
      activeClip.current = clipName
      return
    }
    if (clip) return

    walkBlend.current = MathUtils.damp(walkBlend.current, moving ? 1 : 0, 8, delta)
    phase.current += delta * (moving ? 7.5 : 1.4)
    const swing = Math.sin(phase.current) * walkBlend.current
    const setRotation = (name: string, target: number) => {
      const bone = bones.current[name]
      if (bone) bone.rotation.x = MathUtils.damp(bone.rotation.x, target, 12, delta)
    }
    setRotation('upper_arm.L', swing * 0.48)
    setRotation('upper_arm.R', -swing * 0.48)
    setRotation('thigh.L', -swing * 0.52)
    setRotation('thigh.R', swing * 0.52)
    setRotation('shin.L', Math.max(0, swing) * 0.36)
    setRotation('shin.R', Math.max(0, -swing) * 0.36)
    const head = bones.current.head
    if (head) head.rotation.z = MathUtils.damp(head.rotation.z, Math.sin(phase.current) * 0.015 * (1 - walkBlend.current), 8, delta)
    if (moving || walkBlend.current > 0.002) invalidate()
  })

  return (
    <group ref={group} name="pallavi-character" rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.85, 0]} scale={[0.8, 1.35, 0.8]}><sphereGeometry args={[0.65, 12, 8]} /><meshBasicMaterial ref={teleportAura} color="#f4f8ff" transparent opacity={0} depthWrite={false} toneMapped={false} /></mesh>
      <pointLight ref={teleportLight} position={[0, 0.85, 0]} color="#f2f7ff" intensity={0} distance={3} decay={2} />
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(modelUrl)

function useMemoVector() {
  return useRef(new Vector3()).current
}
