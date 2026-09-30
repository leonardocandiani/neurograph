"""Rebuilds demo-3d.html by inlining src/neurograph3d.js into scripts/demo-3d.tpl.html.

The demo stays a single file that opens over file://, where ES modules are blocked.
Run after any change to src/neurograph3d.js:  python3 scripts/build-demo-3d.py
"""
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
shape = next(l for l in (root / "src/neurograph.js").read_text().splitlines(True) if l.startswith("export const BRAIN_SHAPE"))
shape = shape.replace("export const", "const", 1)
mod = (root / "src/neurograph3d.js").read_text()
mod = mod.replace('import { BRAIN_SHAPE } from "./neurograph.js";\n', "")
mod = re.sub(r"^export default .*\n", "", mod, flags=re.M)
mod = mod.replace("export const", "const").replace("export function", "function")
tpl = (root / "scripts/demo-3d.tpl.html").read_text()
(root / "demo-3d.html").write_text(tpl.replace("/*__MODULE__*/", shape + mod))
print("demo-3d.html rebuilt")
