import { useState } from "react";
// In a real project, copy the repo's src/ folder into your app and import
// from there. Here the path points at the src/ folder at the repo root.
import Neurograph from "../../../src/Neurograph.jsx";

export default function App() {
  const [count, setCount] = useState(1100);
  const [follow, setFollow] = useState(0.6);
  const [anatomy, setAnatomy] = useState(0.28);

  return (
    <div className="hero">
      <Neurograph
        count={count}
        followSulci={follow}
        anatomy={anatomy}
        linkDistance={46}
        colorA="#22d3ee"
        colorB="#a855f7"
      />

      <div className="overlay">
        <h1>Connected intelligence</h1>
        <p>a real anatomical brain, 100% canvas 2D</p>
      </div>

      <div className="panel">
        <label>Nodes: {count}</label>
        <input
          type="range" min="200" max="1600" value={count}
          onChange={(e) => setCount(+e.target.value)}
        />
        <label>Follow sulci: {follow.toFixed(2)}</label>
        <input
          type="range" min="0" max="100" value={follow * 100}
          onChange={(e) => setFollow(+e.target.value / 100)}
        />
        <label>Anatomy: {anatomy.toFixed(2)}</label>
        <input
          type="range" min="0" max="100" value={anatomy * 100}
          onChange={(e) => setAnatomy(+e.target.value / 100)}
        />
      </div>
    </div>
  );
}
