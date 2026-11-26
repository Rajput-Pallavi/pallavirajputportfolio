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
  { id: 'home', label: 'Home', ground: [0, 5.8], facing: [0, 0, 1], cameraOffset: [-1.9, 1.45, 2.75], cameraTargetHeight: 0.5 },
  { id: 'about', label: 'About Me', ground: [-5.7, 3.45], facing: [0.7, 0, 0.7], cameraOffset: [-2.3, 1.55, 2.55], cameraTargetHeight: 0.55 },
  { id: 'skills', label: 'Skills', ground: [-5.35, -0.9], facing: [0.7, 0, 0.7], cameraOffset: [-1.9, 1.7, 2.8], cameraTargetHeight: 0.45 },
  { id: 'faith', label: 'Pray', ground: [-0.75, 1.65], facing: [0, 0, -1], cameraOffset: [3.8, 2.45, 4.3], cameraTargetHeight: 1.15 },
  { id: 'work', label: 'My Work', ground: [5.35, -0.9], facing: [-0.7, 0, 0.7], cameraOffset: [2.35, 1.55, 2.55], cameraTargetHeight: 0.55 },
  { id: 'contact', label: 'Contact', ground: [5.7, 3.45], facing: [0, 0, 1], cameraOffset: [2.4, 1.8, 3.15], cameraTargetHeight: 0.55 },
] as const

// Extra approach/exit controls keep the route on the open front slope and
// curve around destination props while retaining every exact stopping point.
export const JOURNEY_PATH_WAYPOINTS: readonly [number, number][] = [
  JOURNEY_DESTINATIONS[0].ground,
  [-2.4, 5.2],
  [-4.4, 4.25],
  JOURNEY_DESTINATIONS[1].ground,
  [-5.85, 2.1],
  [-5.65, 0.35],
  JOURNEY_DESTINATIONS[2].ground,
  [-4.1, -0.15],
  [-2.2, 0.8],
  JOURNEY_DESTINATIONS[3].ground,
  [1.2, 0.75],
  [3.1, -0.15],
  JOURNEY_DESTINATIONS[4].ground,
  [5.65, 0.45],
  [5.85, 2.1],
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
