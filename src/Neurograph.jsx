"use client";
/**
 * <Neurograph /> — React wrapper around ./neurograph.js
 *
 *   import Neurograph from "./Neurograph.jsx";
 *
 *   <div style={{ height: "100vh" }}>
 *     <Neurograph count={1100} followSulci={0.6} />
 *   </div>
 *
 * The canvas fills 100% of its parent, so give the parent a height.
 * The "use client" directive above already covers Next.js app router.
 */
import { useEffect, useRef } from "react";
import { createNeurograph, DEFAULTS } from "./neurograph.js";

export default function Neurograph({ className = "", style, ...opts }) {
  const canvasRef = useRef(null);
  const instRef = useRef(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // create once
  useEffect(() => {
    instRef.current = createNeurograph(canvasRef.current, optsRef.current);
    return () => { instRef.current?.destroy(); instRef.current = null; };
  }, []);

  // any prop change becomes an update() — the canvas is never remounted
  useEffect(() => { instRef.current?.update(optsRef.current); });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}

export { DEFAULTS };
