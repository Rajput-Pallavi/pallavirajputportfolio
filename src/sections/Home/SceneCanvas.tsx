import { Component, Suspense, useRef, useState, type ReactNode } from 'react'
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
  const [cinematicActive, setCinematicActive] = useState(true)
  const [manualOrbitActive, setManualOrbitActive] = useState(false)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [previewHour, setPreviewHour] = useState<number | null>(null)
  const [shivaProximity, setShivaProximity] = useState(0)

  return (
    <div className="relative h-dvh w-full">
      <SceneErrorBoundary>
        <Canvas
          aria-label="Interactive 3D preview"
          camera={{ position: CAMERA_POSITIONS.wide.position, fov: 45 }}
          dpr={[1, 2]}
          frameloop="demand"
          shadows="percentage"
          onCreated={() => setReady(true)}
          fallback={<p role="alert">WebGL is unavailable in this browser.</p>}
        >
          <DayNightController previewHour={previewHour}>
            <SkyEnvironment />
            <SnowParticles />
            <CameraController
              onCinematicChange={setCinematicActive}
              controlsRef={controlsRef}
              manualOrbitActive={manualOrbitActive}
              followEnabled
            />
            <JourneyController enabled={!cinematicActive} />
            <OrbitControls
              ref={controlsRef}
              makeDefault
              enabled={!cinematicActive}
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
              onStart={() => setManualOrbitActive(true)}
              onEnd={() => setManualOrbitActive(false)}
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
        <label className="absolute bottom-5 left-5 z-20 rounded-xl border border-white/30 bg-slate-950/55 p-3 text-sm text-white backdrop-blur-sm">
          Test Shivji reveal
          <input className="mt-2 block w-44" type="range" min="0" max="1" step="0.01" value={shivaProximity} onChange={(event) => setShivaProximity(Number(event.target.value))} />
        </label>
      </SceneErrorBoundary>
    </div>
  )
}
