# The Tunnel

How the infinite zoom works — explained from scratch.

Conceptual companion to `examples/infinite-zoom.html`, the same way
`doc/shared-lines.md` is the companion to the grid engine. Measurements and
the decision log live in `doc/infinite-zoom.md`; this document is only about
*the idea*. It assumes you've read `shared-lines.md` §1 (the shape) and §8
(why zoom works).

---

## 1. What we want

Click "next" and the whole spiral grows straight out of its eye toward you.
Cells that were tiny become big; the big ones fly past the edges of the
screen; new tiny cells keep appearing at the eye. It never ends. When the
motion stops, the layout looks exactly like it did before you clicked — the
same shapes in the same places — just with different content in them.

Four things have to be true for that to work:

1. Growing the spiral must land it *on top of itself* (§2).
2. Something must be at the eye to grow into view (§3).
3. When the motion stops, we need to quietly go back to the start without
   anyone noticing (§4).
4. It has to stay sharp while moving (§5).

---

## 2. Growing the spiral lands it on itself

Recall the shape: cell 2 is cell 1 shrunk by φ (0.618) and turned 90°; cell
3 is cell 2 shrunk and turned again; and so on, every cell a smaller, turned
copy of the previous one, all coiling toward the eye.

Now do the opposite. Take the *whole* picture and scale it **up** by 1/φ
(1.618) with the eye held fixed. Cell 2 grows to the size cell 1 had, cell 3
to the size cell 2 had… but each is still turned 90° relative to where the
old cell was. Do that four times and every cell has grown by 1/φ⁴ = 6.854
and turned 4 × 90° = 360° — a full circle, which is no turn at all.

So: **scale the picture by 6.854 about the eye, and cell 5 sits exactly
where cell 1 was, cell 6 where cell 2 was, cell 7 where cell 3 was, cell 8
where cell 4 was.** No rotation needed. The layout is back on top of itself,
one "lap" (four cells) deeper.

In CSS that's one line, applied to the container:

```css
transform: scale(6.854);          /* 1/φ⁴ */
transform-origin: 72.36% 72.36%;  /* the eye */
```

Animate from `scale(1)` to `scale(6.854)` over a second and you have one
step of the tunnel. (Adding `rotate(-360deg)` would land in the same place —
it's the same picture at the end — but the *journey* becomes a spin. We
don't want that; straight zoom only.)

---

## 3. Something has to be at the eye

Here's the catch. A spiral with, say, 8 cells has a hole at its eye — the
leftover golden rectangle after cell 8. At rest that hole is φ⁸ ≈ 2% of the
width; you don't notice it. But as you scale up by 6.854, the hole grows to
φ⁴ ≈ 15% of the width — right where you're looking. And at the end of the
lap, cells 1–4 have flown off-screen, cells 5–8 are the new big four, and
the positions where 5–8 *used* to be are empty.

We need cells 9, 10, 11, 12… already in place, tiny, at the eye, ready to
grow. And then 13–16 behind those. As deep as the eye can see.

The trick: don't make one spiral with 16 cells. Make **four spirals of four
cells each** and stack them:

```
layer 0:  items 1–4,   full size                 (scale 1)
layer 1:  items 5–8,   scaled by φ⁴  = 0.146      → sits in layer 0's eye
layer 2:  items 9–12,  scaled by φ⁸  = 0.021      → sits in layer 1's eye
layer 3:  items 13–16, scaled by φ¹² = 0.003      → sits in layer 2's eye (2px wide)
```

Every layer is the *same* four-cell spiral at the *same* full size, laid on
top of the others (`position: absolute; inset: 0`), and scaled about the
*same* eye. Because of §2, a spiral scaled by φ⁴ about the eye lands
precisely in the hole of the unscaled one. So layer 1 fills layer 0's eye,
layer 2 fills layer 1's eye, and so on. The stack looks like one 16-cell
spiral.

Why "same size, same eye" matters, and not "put the next spiral inside the
last cell": browsers round layout to fractions of a pixel. If the inner
spiral is laid out inside a small cell, it inherits that cell's rounding,
and when you scale it up 6.854× the rounding error is magnified into a
visible seam. Four identical full-size layouts round identically, so they
line up exactly. (We tried the nested version first. It had a 0.1px seam we
couldn't get rid of. See `infinite-zoom.md`.)

---

## 4. The invisible reset

Now animate a lap: every layer scales up by 6.854 over 1.2 seconds.

- Layer 0 grows from 1 to 6.854 and flies off-screen.
- Layer 1 grows from 0.146 to 1 — it's now exactly where layer 0 was.
- Layer 2 grows from 0.021 to 0.146 — exactly where layer 1 was.
- Layer 3 grows from 0.003 to 0.021 — exactly where layer 2 was.

At the moment the animation lands, what's on screen is: items 5–8 full
size, 9–12 in the eye, 13–16 deeper. Which is *precisely* what a fresh
render would show if we started over with the content shifted by four:

```
layer 0:  items 5–8,   scale 1
layer 1:  items 9–12,  scale 0.146
layer 2:  items 13–16, scale 0.021
layer 3:  items 17–20, scale 0.003     ← new, 2px, nobody sees it appear
```

So we do that — but **recycle, don't rebuild**. In one go: add 4 to the
offset; take layer 0 (the one that just flew off-screen), move its DOM node
to the back of the stack and refill its four cells with items 17–20; leave
layers 1–3 completely alone — same nodes, same content, they just become
depths 0–2 by relabelling; remove the animation. The screen doesn't change:
every pixel that was there is still there, painted by the same element.

Why not just rebuild all four? With placeholder divs you'd never notice.
With real content you would: rebuilding means every image re-decodes, every
video restarts, every iframe reloads, scroll positions and form state inside
cells vanish — at every lap. Recycling touches one layer's content per lap,
and that layer is 2px wide when it gets it, so any decoding happens at rest,
between laps, never during motion. Memory is constant either way (four
layers, forever), but recycling keeps the *state* of the three visible
layers intact.

Two follow-ons for heavy content, both in the prototype (`?images`): media
is only given a real `src` once its layer is at a depth where it can be
seen, and the *next* four items are preloaded and decoded at rest so the
refill finds them cached. Tested with 16 photos: no dropped frames over 8
laps, reset still 4 pixels.

That's the whole state of the system: **one number, the offset.** No layer
bookkeeping, no "move the outermost to the innermost", no array of
positions. The content is a list and the offset says where the window into
it starts. Infinite by construction.

One detail that bit us: the reset has to happen *before* the animation is
removed, in the same JavaScript task. Otherwise the browser can paint one
frame of the old content without the transform — a flash of items 1–4
snapping back to full size. The Web Animations API makes this clean:

```js
const anims = layers.map((el, k) => el.animate(
  [{ transform: `scale(${φ⁴ᵏ})` }, { transform: `scale(${φ⁴⁽ᵏ⁻¹⁾})` }],
  { duration: 1200, fill: "forwards" }   // hold the end pose…
));
Promise.all(anims.map(a => a.finished)).then(() => {
  offset += 4;
  zoom.appendChild(zoom.firstElementChild);          // layer 0 → back of the stack
  fillLayer(zoom.lastElementChild, offset + 12);     // …with the next 4 items
  relabel();                                         // depths 0–3, rest transforms
  anims.forEach(a => a.cancel());                    // …then let go. Same task → same paint.
});
```

We verified it by screenshotting the frame before and after the reset:
4 pixels differ out of 252,800.

---

## 5. Keeping it sharp

The first version animated a single wrapper around the four layers. It
worked, and it was blurry. Here's why, because it's a thing you'll hit
again.

When the browser animates a `transform`, it doesn't repaint every frame.
It paints the layer to a bitmap **once**, at the size it has when the
animation starts, then hands the bitmap to the GPU to stretch and squash
per frame. That's why transform animations are cheap. But layer 1 starts
at 0.146× — its 71px text is painted as a 10px bitmap — and then gets
stretched 6.854×. Ten pixels stretched to seventy: mush. It snaps sharp
only when the animation ends and the browser repaints at rest.

The fix is to know how the browser picks the bitmap size: it looks at the
animation running **on that layer itself** and paints at the *largest*
scale the animation will reach. Our wrapper was the only thing animating;
the layers inside it were static children, so each got painted at its
resting scale. Animate each layer's *own* transform instead — layer 1 from
0.146 to 1 — and the browser paints layer 1 at 1× up front. From then on
it's only ever shrunk, never stretched.

That's the only reason the code animates four elements instead of one.
Measured sharpness mid-lap went from 6 to 16.5, where the resting layout
is 19. The outgoing layer 0 (going from 1× to 6.854×) still softens as it
leaves — the browser won't paint a bitmap that big — but it's flying away
from where you're looking.

---

## 6. Inputs

- **Click / →**: one lap, animated as above.
- **Wheel**: instead of a timed animation, the wheel sets the progress
  directly — `p` from 0 to 1 within the lap, transform `scale(φ^(4k − 4p))`
  on layer k. When `p` passes 1, do the reset (§4) and keep the remainder.
  When the wheel goes quiet, ease to whichever end is nearer: past halfway
  finishes the lap, before halfway eases back.

Same maths, different clock.

---

## The one-sentence version

Four copies of the same four-cell spiral, each scaled φ⁴ deeper into the
eye of the last; grow them all by 6.854 so each lands where the previous
one was; then swap the content along by four and start again — forever,
with one number as state.
