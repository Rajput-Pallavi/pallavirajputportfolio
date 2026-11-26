import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Html, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MOUSE, TOUCH } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import KailashMountain from './KailashMountain'
import SkyEnvironment from './SkyEnvironment'
import SnowParticles from './SnowParticles'
import CameraController, { CAMERA_POSITIONS } from './CameraController'
import ShivaModel from './ShivaModel'
import DayNightController from './DayNightController'
import CelestialDial from './CelestialDial'
import PallaviCharacter from './PallaviCharacter'
import JourneyController from './JourneyController'
import JourneyNavigation from './JourneyNavigation'
import HomeWelcome from './HomeWelcome'
import AboutDiary from './AboutDiary'
import SkillsDetails from './SkillsDetails'
import WorkProjects from './WorkProjects'
import ContactGreeting from './ContactGreeting'
import TravellerGroundGlow from './TravellerGroundGlow'

const INITIAL_SCENE_TARGET: [number, number, number] = [0, 1.6, -0.7]

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="grid h-full place-items-center">
          The 3D scene could not load.
        </p>
      )
    }

    return this.props.children
  }
}

export default function SceneCanvas() {
  const [ready, setReady] = useState(false)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [previewHour, setPreviewHour] = useState<number | null>(null)
  const [shivaProximity, setShivaProximity] = useState(0)
  const [homeVisible, setHomeVisible] = useState(true)
  const [diaryOpen, setDiaryOpen] = useState(false)
  const [skillCategory, setSkillCategory] = useState<string | null>(null)
  const [workVisible, setWorkVisible] = useState(false)
  const [contactVisible, setContactVisible] = useState(false)
  const [introActive, setIntroActive] = useState(true)
  const displayHour = previewHour ?? new Date().getHours()
  const isNight = displayHour >= 19 || displayHour < 6

  useEffect(() => {
    const reveal = () => setShivaProximity(1)
    window.addEventListener('shiva:reveal', reveal)
    return () => window.removeEventListener('shiva:reveal', reveal)
  }, [])

  useEffect(() => {
    const navigating = () => { setHomeVisible(false); setDiaryOpen(false); setSkillCategory(null); setWorkVisible(false); setContactVisible(false) }
    const arrived = (event: Event) => {
      const destination = (event as CustomEvent<number>).detail
      setHomeVisible(destination === 0)
      if (destination === 1) setDiaryOpen(true)
      setWorkVisible(destination === 4)
      setContactVisible(destination === 5)
    }
    window.addEventListener('journey:navigate', navigating)
    window.addEventListener('journey:arrived', arrived)
    return () => {
      window.removeEventListener('journey:navigate', navigating)
      window.removeEventListener('journey:arrived', arrived)
    }
  }, [])

  useEffect(() => {
    const select = (event: Event) => setSkillCategory((event as CustomEvent<string>).detail)
    window.addEventListener('skills:select', select)
    return () => window.removeEventListener('skills:select', select)
  }, [])

  return (
    <div className="relative h-dvh w-full">
      <SceneErrorBoundary>
        <Canvas
          aria-label="Interactive 3D preview"
          camera={{ position: CAMERA_POSITIONS.wide.position, fov: 50 }}
          dpr={[1, 2]}
          frameloop="demand"
          shadows="percentage"
          onCreated={() => setReady(true)}
          fallback={<p role="alert">WebGL is unavailable in this browser.</p>}
        >
          <DayNightController previewHour={previewHour}>
            <SkyEnvironment />
            <SnowParticles />
            <CameraController controlsRef={controlsRef} onIntroChange={setIntroActive} />
            <JourneyController enabled />
            <TravellerGroundGlow />
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enabled={!introActive}
              target={INITIAL_SCENE_TARGET}
              minDistance={1.6}
              maxDistance={40}
              minAzimuthAngle={-Infinity}
              maxAzimuthAngle={Infinity}
              minPolarAngle={0.08}
              maxPolarAngle={Math.PI - 0.08}
              enablePan={false}
              enableDamping
              dampingFactor={0.07}
              rotateSpeed={0.65}
              zoomSpeed={0.85}
              mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }}
              touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_ROTATE }}
            />
            <Suspense
              fallback={
                <Html center>
                  <p role="status" className="whitespace-nowrap">Loading 3D scene…</p>
                </Html>
              }
            >
              <KailashMountain />
              <PallaviCharacter />
              <ShivaModel proximity={shivaProximity} />
            </Suspense>
          </DayNightController>
        </Canvas>
        {!ready && (
          <p role="status" className="pointer-events-none absolute inset-0 grid place-items-center">
            Loading 3D scene…
          </p>
        )}
        <CelestialDial value={previewHour} onChange={setPreviewHour} />
        <JourneyNavigation isNight={isNight} />
        <HomeWelcome visible={homeVisible} isNight={isNight} />
        <AboutDiary open={diaryOpen} isNight={isNight} onClose={() => setDiaryOpen(false)} />
        <SkillsDetails category={skillCategory} isNight={isNight} onClose={() => setSkillCategory(null)} />
        <WorkProjects visible={workVisible} isNight={isNight} />
        <ContactGreeting visible={contactVisible} isNight={isNight} />
      </SceneErrorBoundary>
    </div>
  )
}
