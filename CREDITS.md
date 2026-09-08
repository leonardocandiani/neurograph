# Credits

## Code

MIT. See [LICENSE](LICENSE).

## Anatomical geometry

The silhouette and the sulci embedded in [`src/neurograph.js`](src/neurograph.js)
(the `BRAIN_SHAPE` constant) are derived from a **public-domain** lateral
illustration of the human brain, from Wikimedia Commons:

<https://commons.wikimedia.org/wiki/File:Brain-outline-lateral.svg>

### How it was extracted

1. rasterize the SVG at 900px wide;
2. build a binary mask from alpha + luminance, then flood fill from the borders to
   close interior holes;
3. trace contours with **marching squares**;
4. simplify with **Douglas-Peucker** (ε ≈ 1.6px for the outer contour, 1.9px for
   the sulci);
5. normalize to integers `0..1000` relative to the brain width.

Result: 1 outer contour (87 points, cerebellum and brain stem included) plus 52
sulci polylines (~1180 points). About 10KB of numbers.

Because this is public-domain work turned into geometric data, no attribution is
legally required. The credit above is courtesy.

## Using another shape

`BRAIN_SHAPE` is `{ aspect, outline: string[], sulci: string[] }`, where every
string is `"x y x y x y ..."` in integers `0..1000` (x normalized by the width,
y on the same scale, so `aspect` carries the height ratio).

Anything you can rasterize can go through the same pipeline: a front view, a top
view, a hand, a logo. The engine only needs a closed outline to keep nodes inside
and a set of polylines to lay them along.
