export type Vec3 = [number, number, number]

export type JourneyDestination = {
  id: 'home' | 'about' | 'skills' | 'faith' | 'work' | 'contact'
  label: string
  ground: [number, number]
  facing: Vec3
  cameraOffset: Vec3
  cameraTargetHeight: number
}

export const JOURNEY_DESTINATIONS: readonly JourneyDestination[] = [
  { id: 'home', label: 'Home', ground: [-5.7, 4.65], facing: [0.72, 0, -0.7], cameraOffset: [-1.9, 1.45, 2.75], cameraTargetHeight: 0.5 },
  { id: 'about', label: 'About Me', ground: [-4.15, 3.1], facing: [0.82, 0, -0.57], cameraOffset: [-2.3, 1.55, 2.55], cameraTargetHeight: 0.55 },
  { id: 'skills', label: 'Skills', ground: [-2.7, 2.25], facing: [0.94, 0, -0.34], cameraOffset: [-1.9, 1.7, 2.8], cameraTargetHeight: 0.45 },
  { id: 'faith', label: 'Faith', ground: [-1.25, 1.65], facing: [-0.05, 0, -1], cameraOffset: [3.8, 2.45, 4.3], cameraTargetHeight: 1.15 },
  { id: 'work', label: 'My Work', ground: [1.9, 1.85], facing: [-0.88, 0, -0.47], cameraOffset: [2.35, 1.55, 2.55], cameraTargetHeight: 0.55 },
  { id: 'contact', label: 'Contact', ground: [4.85, 3.85], facing: [-0.78, 0, -0.63], cameraOffset: [2.4, 1.8, 3.15], cameraTargetHeight: 0.55 },
] as const

// Extra approach/exit controls keep the route on the open front slope and
// curve around destination props while retaining every exact stopping point.
export const JOURNEY_PATH_WAYPOINTS: readonly [number, number][] = [
  JOURNEY_DESTINATIONS[0].ground,
  [-5.25, 4.18],
  [-4.7, 3.62],
  JOURNEY_DESTINATIONS[1].ground,
  [-3.72, 2.76],
  [-3.2, 2.48],
  JOURNEY_DESTINATIONS[2].ground,
  [-2.18, 2.03],
  [-1.72, 1.82],
  JOURNEY_DESTINATIONS[3].ground,
  [-0.55, 1.55],
  [0.25, 1.5],
  [1.05, 1.62],
  JOURNEY_DESTINATIONS[4].ground,
  [2.75, 2.33],
  [3.72, 3.05],
  JOURNEY_DESTINATIONS[5].ground,
] as const

export type ResolvedDestination = JourneyDestination & {
  position: Vec3
  cameraPosition: Vec3
  cameraTarget: Vec3
}

export function resolveDestinations(heightAt: (x: number, z: number) => number): ResolvedDestination[] {
  return JOURNEY_DESTINATIONS.map((destination) => {
    const [x, z] = destination.ground
    const y = heightAt(x, z)
    return {
      ...destination,
      position: [x, y, z],
      cameraPosition: [x + destination.cameraOffset[0], y + destination.cameraOffset[1], z + destination.cameraOffset[2]],
      cameraTarget: [x, y + destination.cameraTargetHeight, z],
    }
  })
}
