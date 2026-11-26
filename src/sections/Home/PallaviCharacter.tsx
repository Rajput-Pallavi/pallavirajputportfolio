import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Bone, MathUtils, Mesh, MeshStandardMaterial, type Group } from 'three'

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

  useLayoutEffect(() => {
    const start = rootScene.getObjectByName('kailash-mountain')?.userData.walkingPath?.[0]
    if (group.current && start) group.current.position.set(start[0], start[1] + 0.03, start[2])
  }, [rootScene])

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Bone) bones.current[child.name] = child
      if (!(child instanceof Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      if (child.material instanceof MeshStandardMaterial) child.material.envMapIntensity = 0.8
    })
  }, [scene])

  useFrame((_, delta) => {
    if (!group.current) return
    const moving = group.current.userData.motion === 'walk'
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
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(modelUrl)
