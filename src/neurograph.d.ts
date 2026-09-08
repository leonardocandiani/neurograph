export type NeurographShape = "brain" | "network" | "globe";

export interface NeurographOptions {
  /** 'brain' uses the anatomical silhouette, 'network' is a free field, 'globe' is a spinning sphere */
  shape?: NeurographShape;
  /** number of nodes (default 1100) */
  count?: number;
  /** max connection distance in px (default 46) */
  linkDistance?: number;
  /** 0..1 — share of nodes born on the real sulci (default 0.6) */
  followSulci?: number;
  /** 0..1 — spring that holds each node near its anchor (default 0.35) */
  cohesion?: number;
  /** 0..2 (default 0.45) */
  speed?: number;
  /** synapses travelling at the same time (default 26) */
  pulses?: number;
  /** 0..1 (default 0.55) */
  glow?: number;
  /** 0..1 — outline + sulci opacity, 0 shows the network only (default 0.28) */
  anatomy?: number;
  colorA?: string;
  colorB?: string;
  /** mouse repels nodes and click fires a wave (default true) */
  interactive?: boolean;
  /** mirror the brain horizontally (default false) */
  flip?: boolean;
  /** devicePixelRatio ceiling (default 2) */
  maxDpr?: number;
  /** honour prefers-reduced-motion by rendering a single static frame (default true) */
  respectReducedMotion?: boolean;
}

export interface NeurographInstance {
  /** change options at runtime; rebuilds nodes only when needed */
  update(next: NeurographOptions): NeurographInstance;
  /** force a full rebuild */
  rebuild(): NeurographInstance;
  start(): void;
  stop(): void;
  readonly options: Required<NeurographOptions>;
  readonly nodeCount: number;
  destroy(): void;
}

export declare const DEFAULTS: Required<NeurographOptions>;

/** Anatomical geometry. Integers 0..1000 are relative to the brain width. */
export declare const BRAIN_SHAPE: {
  aspect: number;
  outline: string[];
  sulci: string[];
};

export declare function createNeurograph(
  canvas: HTMLCanvasElement,
  options?: NeurographOptions
): NeurographInstance;

export default createNeurograph;
