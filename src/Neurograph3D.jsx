"use client";
/**
 * <Neurograph3D />: React wrapper around ./neurograph3d.js
 *
 *   import Neurograph3D from "./Neurograph3D.jsx";
 *
 *   <div style={{ height: "100vh" }}>
 *     <Neurograph3D density={1} pulses={120} />
 *   </div>
 *
 * The canvas fills 100% of its parent, so give the parent a height.
 * Creating the instance throws when WebGL is unavailable: feature detect
 * first and render <Neurograph /> instead, or wrap this in an error boundary.
 */
import { useEffect, useRef } from "react";
import { createNeurograph3D, DEFAULTS_3D } from "./neurograph3d.js";

export default function Neurograph3D({ className = "", style, ...opts }) {
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // create once
  useEffect(() => {
    instRef.current = createNeurograph3D(canvasRef.current, optsRef.current);
    return () => { instRef.current?.destroy(); instRef.current = null; };
  }, []);

  // any prop change becomes an update(), the canvas is never remounted
  useEffect(() => { instRef.current?.update(optsRef.current); });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}

export { DEFAULTS_3D };
