export interface NeurographOptions3D {
  /** 1 is the reference desktop cloud (about 8200 surface points), 0.44 suits TVs (default 1) */
  density?: number;
  /** draw the neighbour links between points (default true) */
  links?: boolean;
  /** synapses travelling at the same time, needs links (default 120) */
  pulses?: number;
  /** background stars, 0 disables (default 3000) */
  stars?: number;
  /** 0..1 nebula strength, 1 is the reference look, 0 turns it off (default 1) */
  glow?: number;
  /** cool end of the gradient (default "#66EBF7") */
  colorA?: string;
  /** warm end of the gradient (default "#AD99FF") */
  colorB?: string;
  /** clear colour (default "#02050B") */
  background?: string;
  /** slow yaw and pitch orbit (default true) */
  autoRotate?: boolean;
  /** yaw amplitude of the orbit, in radians (default 0.62) */
  rotateAmplitude?: number;
  /** points fly in from a scatter while the camera dollies in (default true) */
  intro?: boolean;
  /** intro duration in ms (default 4200) */
  introMs?: number;
  /** a random wave every 11 to 17 seconds (default true) */
  ambientWaves?: boolean;
  /** frame cap, 0 is uncapped (default 0, TVs use 30) */
  fps?: number;
  /** devicePixelRatio ceiling (default 2) */
  maxDpr?: number;
  /** drag rotates yaw with inertia and eases back, click fires a wave from the nearest point (default true) */
  interactive?: boolean;
  /** honour prefers-reduced-motion by rendering a single static frame (default true) */
  respectReducedMotion?: boolean;
  /** the whole brain always fits the canvas, in portrait and landscape (default "contain") */
  fit?: "contain";
  /** called after every rendered frame, handy to reposition HTML labels with project() */
  onFrame?: ((brain: NeurographInstance3D) => void) | null;
}

export interface NeurographPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface NeurographInstance3D {
  /** fire a wave from a model-space point, or from a random point when omitted; does nothing under prefers-reduced-motion */
  wave(point?: NeurographPoint3D): void;
  /** model-space point to CSS pixels of the canvas, as of the last rendered frame */
  project(point: NeurographPoint3D): { x: number; y: number; visible: boolean };
  /** point on the front surface for 2D brain coordinates 0..1000 (same space as BRAIN_SHAPE) */
  surfacePoint(u: number, v: number): NeurographPoint3D;
  /** change options at runtime; rebuilds the cloud only when density, links or stars change */
  update(next: NeurographOptions3D): NeurographInstance3D;
  start(): void;
  stop(): void;
  /** release GL buffers and programs, remove listeners, cancel the frame loop */
  destroy(): void;
  readonly nodeCount: number;
  readonly linkCount: number;
}

export declare const DEFAULTS_3D: Required<NeurographOptions3D>;

/**
 * Throws Error("neurograph3d: WebGL is not available") when the canvas has no WebGL, and a
 * "shader compile failed" / "program link failed" error when the GPU rejects the shaders.
 * Fall back to createNeurograph on a fresh canvas: one that asked for WebGL cannot give a 2D context.
 */
export declare function createNeurograph3D(
  canvas: HTMLCanvasElement,
  options?: NeurographOptions3D
): NeurographInstance3D;
