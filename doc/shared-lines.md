# The Shared-Lines Idea

How a golden spiral becomes a plain CSS Grid — explained from scratch.

This is the conceptual companion to `src/spiral-grid.grid.css`. It is written
for someone who knows basic CSS and has never thought about golden rectangles.
The comparison numbers and the engine decision live in `doc/grid-engine.md`;
this document is only about *the idea*.

---

## 1. The shape we're drawing

Start with a **golden rectangle**: a rectangle whose width and height are in
the ratio 1 : 0.618. That number, 0.618…, is called **φ** (phi). Its defining
property is the one everything below depends on:

> If you cut the biggest possible square off a golden rectangle,
> the piece that's left over is *also* a golden rectangle.

Let's do it. Width 1, height φ. The biggest square you can cut is φ × φ, on
the left. What remains on the right is a strip of width 1 − φ and height φ.
Is that strip golden? Its ratio is (1 − φ) : φ, and it happens that
1 − φ = φ² (that's what makes φ special), so the ratio is φ² : φ = φ : 1. Yes
— it's a golden rectangle, standing upright instead of lying down.

So we can cut again. The biggest square in the upright strip is φ² × φ²,
at the top. What's left is a small rectangle at the bottom-right — golden
again, lying down again. Cut again: square φ³ × φ³ on the right. Left over:
golden, upright. Cut: φ⁴ on the bottom. And so on, forever:

```
┌────────────┬───────┐
│            │   2   │
│            │       │
│     1      ├──┬─┬──┤
│            │5 │6│  │
│            ├──┴─┤3 │
│            │ 4  │  │
└────────────┴────┴──┘
```

Three facts to carry forward:

- Square *i* has side φⁱ⁻¹ (cell 1 is φ⁰ = 1 × the height; cell 2 is φ × that;
  cell 3 is φ² × that; …). Each square is 0.618 × the previous one.
- The squares are placed **left, top, right, bottom, left, top, …** —
  the position rotates 90° each time.
- The leftovers shrink toward a single point, called the **eye** of the
  spiral. In our coordinates (width 1, height φ) the eye sits at
  (0.7236, 0.7236 × φ) — about 72% across and 72% down. We'll need it for
  zoom, not for layout.

Ten cells is plenty: cell 10 is φ⁹ ≈ 1.3% of the container width — already
too small to put anything in.

---

## 2. Two ways to draw it

Now we have to make a browser produce that picture from ten `<div>`s.

### Way A — "one square, shrunk and rotated"

Every cell in the spiral is the *same* square, just smaller and turned.
Cell 2 is cell 1 scaled by φ and rotated 90° about the eye. Cell 3 is cell 1
scaled by φ² and rotated 180°. In general:

```css
.cell:nth-child(i) { transform: scale(φⁱ⁻¹) rotate(90° × (i-1)); }
```

with `transform-origin` at the eye. One formula covers every cell. This is
what the original engine (`spiral-grid.css`) does, and it's genuinely
elegant.

But look at what the browser is actually doing. It lays out every cell as a
**full-size** square — as big as cell 1 — and then shrinks the *picture* of
it. Everything inside shrinks with it. A `1px` border in cell 5 is drawn as
a 1px border and then scaled by φ⁴ = 0.146, so it appears 0.15px wide. Text
set at `16px` appears at 2.3px. A scrollbar shrinks. Padding shrinks.

Every feature then needs an "undo the shrink" correction: gap had to be
divided by φⁱ, padding divided by φⁱ, font-size multiplied by 1/φⁱ. Each
correction needed a precomputed table for browsers without `pow()`, and a
script to verify the tables. The complexity isn't bad engineering — it's the
mechanism's tax, paid on every feature.

### Way B — "shared lines"

The rest of this document is Way B. The claim: the spiral is secretly a
small table, and CSS Grid already knows how to draw tables.

---

## 3. Notice the squares share edges

Take just the first four cells and draw **every** edge of every square:

```
     x1              x2     x3     x4
     ┌───────────────┬─────────────┐  y1
     │               │             │
     │               │      2      │
     │       1       │             │
     │               ├──────┬──────┤  y2
     │               │  4   │  3   │
     └───────────────┴──────┴──────┘  y3
```

Four squares, each with a left edge and a right edge — eight vertical edges.
But count the *distinct* vertical lines in the picture:

- Cell 1's right edge, cell 2's left edge, cell 4's left edge are **all the
  same line** (x2).
- Cell 4's right edge and cell 3's left edge are the same line (x3).
- Cell 2's right edge, cell 3's right edge, and the container's right edge
  are the same line (x4).

Eight edges collapse into **four lines**: x1, x2, x3, x4. Horizontally the
same thing happens: y1, y2, y3 — three lines.

Why? Because the squares are packed tight. Each new square is cut from the
leftover rectangle, so it always shares an edge with the squares that came
before. Nothing floats; everything butts up against something.

That picture is already a table. Four vertical lines make **three columns**
(x1→x2, x2→x3, x3→x4). Three horizontal lines make **two rows**. And each
cell is just "which lines does it stretch between":

| cell | columns (from → to) | rows (from → to) |
|------|---------------------|------------------|
| 1    | x1 → x2             | y1 → y3          |
| 2    | x2 → x4             | y1 → y2          |
| 3    | x3 → x4             | y2 → y3          |
| 4    | x2 → x3             | y2 → y3          |

Cell 2 spans two columns (x2 → x4). Cell 1 spans both rows. That's fine — a
cell in a table is allowed to cover several slots. In fact that's the
mechanism: the *bigger* cells pass straight over the lines that the
*smaller* cells need.

Keep going to ten cells and the same counting gives **7 vertical lines and
7 horizontal lines**. Ten cells don't need ten sizes each. They need six
column widths and six row heights, because they share.

---

## 4. From lines to a grid

CSS Grid is precisely "define some lines, then say which lines each item
spans." Two parts.

### 4a. The tracks (the gaps between the lines)

Between 7 lines there are 6 gaps. Those are the column widths. Walking the
subdivision and measuring where each line lands (the arithmetic is in
§9) gives, left to right:

```
φ¹   φ⁵   φ⁹   φ¹⁰   φ⁷   φ³
```

Read the pattern: a big first column (cell 1), then things get tiny in the
middle (that's the eye, where the spiral coils in), then bigger again toward
the right (cell 3's column). Big → small → tiny → tiny → small → big. The
spiral coils inward from both sides, so the fine lines cluster in the middle.

Numerically:

```css
grid-template-columns: 0.618034fr 0.090170fr 0.013156fr 0.008131fr 0.034442fr 0.236068fr;
```

### 4b. What `fr` means

`fr` is "a fraction of the available space." `grid-template-columns: 2fr 1fr`
means: split the width into 3 shares, first column gets 2, second gets 1.
Only the **ratios** matter — `2fr 1fr`, `0.5fr 0.25fr`, and `200fr 100fr`
all produce the same layout.

So the six numbers above aren't pixel sizes. They're proportions of whatever
width the container has. Make the container wider and every column scales
with it — which is exactly what the spiral needs.

### 4c. Rows are the same six numbers

The row heights, top to bottom, come out as:

```
φ²   φ⁶   φ¹⁰   φ¹¹   φ⁸   φ⁴
```

Compare with the columns: each row is exactly φ × the column in the same
position (φ¹·φ = φ², φ⁵·φ = φ⁶, …). That's not a coincidence — the container
is φ times as tall as it is wide, and the vertical structure is the
horizontal structure turned 90°.

And because `fr` only cares about ratios, a list that's φ × another list
*is the same list*. So:

```css
grid-template-rows: var(--spiral-grid-tracks);   /* same six numbers */
```

The container's `aspect-ratio: 1.618 / 1` makes it the right height; `fr`
divides that height in the same proportions as the width. The whole
geometry of the spiral is **six numbers, used twice**.

(A bug found this. The first draft wrote the rows as the φ² … φ⁴ list
literally, which sums to 0.618. CSS Grid has a rule: if the fr factors sum
to less than 1, treat the sum as 1. So the rows only filled 61.8% of the
height and every cell came out squashed. Normalising the row list to sum
to 1 made it identical to the column list — the fix and the simplification
were the same edit.)

---

## 5. Placing cells, and the fill cell

### 5a. `grid-area`

Lines are numbered 1 to 7. An item is placed with

```css
grid-area: row-start / column-start / row-end / column-end;
```

Reading the ten placements off the subdivision:

```css
.spiral-grid__cell:nth-child(1)  { grid-area: 1 / 1 / 7 / 2; }  /* column 1, all rows      */
.spiral-grid__cell:nth-child(2)  { grid-area: 1 / 2 / 2 / 7; }  /* row 1, columns 2..6     */
.spiral-grid__cell:nth-child(3)  { grid-area: 2 / 6 / 7 / 7; }  /* column 6, rows 2..6     */
.spiral-grid__cell:nth-child(4)  { grid-area: 6 / 2 / 7 / 6; }  /* row 6, columns 2..5     */
.spiral-grid__cell:nth-child(5)  { grid-area: 2 / 2 / 6 / 3; }
.spiral-grid__cell:nth-child(6)  { grid-area: 2 / 3 / 3 / 6; }
.spiral-grid__cell:nth-child(7)  { grid-area: 3 / 5 / 6 / 6; }
.spiral-grid__cell:nth-child(8)  { grid-area: 5 / 3 / 6 / 5; }
.spiral-grid__cell:nth-child(9)  { grid-area: 3 / 3 / 5 / 4; }
.spiral-grid__cell:nth-child(10) { grid-area: 3 / 4 / 4 / 5; }
```

Look at the pattern in the first four: cell 1 takes a column, cell 2 takes a
row, cell 3 takes a column, cell 4 takes a row — left, top, right, bottom.
Then cells 5–8 do it again one level in (columns/rows 2–5), then cells 9–10
again inside that. Each "lap" of the spiral is a ring of four placements,
one step further into the middle of the table.

Why is cell 1 a square if it's "a column"? Because column 1's width (φ)
equals the container's whole height (φ). The track sizes were chosen so
that every one of these areas comes out square. That's the point of §9.

### 5b. The fill cell

Cut off N squares and there's always a leftover golden rectangle at the
eye. If you only have N cells, that leftover is an empty hole. The original
prototype had a white wedge there.

Fix: the **last** cell grows to cover its own square *plus* the leftover.
In grid terms, it just spans to further lines. Cell 4 on its own is
`6 / 2 / 7 / 6` (row 6, columns 2–5). If cell 4 is the last cell, its
leftover is everything above it in columns 2–5, rows 2–5 — so it becomes
`2 / 2 / 7 / 6`: same columns, rows 2 through 6. The remainder after any
cell is always a golden rectangle, and its edges are always existing
lines, so "swallow the remainder" is always just a bigger span.

```css
.spiral-grid:not(.spiral-grid--no-fill) > .spiral-grid__cell:nth-child(4):last-child { grid-area: 2 / 2 / 7 / 6; }
```

`:nth-child(4):last-child` means "the 4th child, when it's also the last."
Ten of these rules cover N = 1 … 10.

Because the fill cell is a golden rectangle, not a square, its content box
is a different shape — but nothing inside it is scaled or rotated, so
normal CSS applies. (In the transform engine, the fill cell was rotated
along with everything else, and needed special "dual aspect" rules for the
content to sit upright.)

---

## 6. Orientation for free

Two modifiers, no extra placement tables.

**Reverse (mirror left ↔ right).** Set `direction: rtl` on the grid. In a
right-to-left context, grid column line 1 is on the *right* edge. Every
`grid-area` rule stays the same; the browser mirrors the result. Content
gets `direction: ltr` back so text reads normally.

**Portrait (tall instead of wide).** Set `writing-mode: vertical-rl` on the
grid. In a vertical writing mode, the grid's "columns" run top to bottom and
its "rows" run right to left — the axes are swapped. Same rules, transposed
result, and `aspect-ratio: 1 / 1.618` makes the container tall. Content
gets `writing-mode: horizontal-tb` back.

`--auto` is just the portrait rules inside a container query
(`@container (aspect-ratio < 1)`), so the spiral flips by itself when its
box is taller than wide.

The transform engine needed four sets of transform origins and separate
fill rules for each combination. Here the *grid itself* is what gets
mirrored or rotated, so the cells never know.

---

## 7. Gap as an inset, not `gap`

CSS Grid has a native `gap` property, and it almost works. The problem is
subtle: `gap` makes room for itself by shrinking the tracks. Our grid has
5 gaps across (between 6 columns) and 5 gaps down (between 6 rows). With an
8px gap, the width loses 40px and the height loses 40px — but the width is
about 1.6× the height, so losing the same 40px from each changes their
ratio. Every "square" comes out ~5% wider than tall.

The next idea, `margin: calc(gap / 2)` on each cell, looked right at
528px and was wrong: a grid item's margin counts toward the minimum size of
its track even when `min-width` is 0, and the eye tracks are only a few
pixels wide. Once the gap exceeded them, the whole `fr` distribution
shifted and the squares went off by the gap width. Padding on the cell has
the same problem.

What works is to leave layout alone entirely: `clip-path: inset(gap / 2)`
on the cell (paint only — the box is unchanged, the browser just doesn't
draw the outer strip) and the same `gap / 2` as padding on the content, so
the content box is exactly the visible cell. Two neighbours are each inset
by gap/2, so between them is exactly one gap. Content padding doesn't feed
track sizing because the cell is a scroll container, whose automatic
minimum is 0.

The transform engine also used clip-path — but had to divide the inset by
φⁱ per cell, and pad the content by the same. Here nothing is scaled, so
both are one constant.

---

## 8. Why zoom still works

The whole reason this project exists is the zoom: "fall into" the eye and
have the spiral keep going. It's worth understanding *why* switching engines
didn't break it.

The spiral is **self-similar**: if you shrink the entire picture by φ
(i.e. scale it *up* by 1/φ ≈ 1.618) and rotate it 90° around the eye,
cell 2 lands exactly where cell 1 was, cell 3 lands where cell 2 was, and so
on. The picture maps onto itself, shifted by one cell.

That's a property of the *shape*, not of how the shape was drawn. Both
engines produce the same rectangles (measured: within 0.02px), so the same
container transform works on both:

```css
.spiral-grid { transform-origin: 72.36% 72.36%; }          /* the eye */
.zoomed      { transform: scale(1.618) rotate(-90deg); }   /* one step in */
```

Note what's being transformed: the **container**, one element. The cells
are never touched. In the transform engine, cells were individually scaled
*and* the container was scaled again for zoom — two layers of transforms.
Here there's one.

One detail the transform engine got "for free" that the grid engine adds
back explicitly: after a one-step zoom, cell 2 is in cell 1's spot but
rotated −90°. If you want each cell to read upright when it becomes the
hero, its content must be pre-rotated by +90° × (i − 1). That's the
`--hero-rotate` modifier: seven `rotate()` rules on `.spiral-grid__content`,
opt-in, only for zoom scenes.

---

## 9. Deriving the six numbers

For readers who want to check the tracks rather than trust them.

Setup: container width 1, height φ. Two identities do all the work:

- **(A)** φ² = 1 − φ, i.e. 1 = φ + φ²
- **(B)** φⁿ = φⁿ⁺¹ + φⁿ⁺² for any n (multiply (A) by φⁿ)

Walk the subdivision. Each step: cut the largest square from the current
leftover, on the side indicated (left, top, right, bottom, repeat). Write
each cell as an x-interval and a y-interval.

| cell | side   | x from → to               | y from → to               |
|------|--------|---------------------------|---------------------------|
| 1    | left   | 0 → φ                     | 0 → φ                     |
| 2    | top    | φ → 1                     | 0 → φ²                    |
| 3    | right  | 1 − φ³ → 1                | φ² → φ                    |
| 4    | bottom | φ → φ + φ⁴                | φ − φ⁴ → φ                |
| 5    | left   | φ → φ + φ⁵                | φ² → φ² + φ⁵              |
| 6    | top    | φ + φ⁵ → φ + φ⁴           | φ² → φ² + φ⁶              |
| 7    | right  | φ + φ⁴ − φ⁷ → φ + φ⁴      | φ² + φ⁶ → φ² + φ⁵         |
| 8    | bottom | φ + φ⁵ → φ + φ⁵ + φ⁸      | φ² + φ⁵ − φ⁸ → φ² + φ⁵    |
| 9    | left   | φ + φ⁵ → φ + φ⁵ + φ⁹      | φ² + φ⁶ → φ² + φ⁶ + φ⁹    |
| 10   | top    | φ + φ⁵ + φ⁹ → φ + φ⁵ + φ⁸ | φ² + φ⁶ → φ² + φ⁶ + φ¹⁰   |

Some endpoints look different but are equal, by (B):

- 1 − φ³ = φ + φ² − φ³ = φ + φ⁴ (cell 3's left edge = cell 4's right edge)
- φ − φ⁴ = φ² + φ³ − φ⁴ = φ² + φ⁵ (cell 4's top edge = cell 5's bottom edge)
- φ + φ⁴ − φ⁷ = φ + φ⁵ + φ⁸ (cell 7's left = cell 8's right)
- φ² + φ⁵ − φ⁸ = φ² + φ⁶ + φ⁹ (cell 8's top = cell 9's bottom)

Those equalities *are* the shared edges of §3, in algebra form.

Collect the distinct x-values and sort them:

```
x:  0,  φ,  φ+φ⁵,  φ+φ⁵+φ⁹,  φ+φ⁵+φ⁸,  φ+φ⁴,  1
```

Seven lines. Subtract neighbours to get the six column widths, simplifying
with (B):

```
φ,   φ⁵,   φ⁹,   φ⁸−φ⁹ = φ¹⁰,   φ⁴−φ⁵−φ⁸ = φ⁶−φ⁸ = φ⁷,   1−φ−φ⁴ = φ²−φ⁴ = φ³
```

Check they sum to 1: φ + φ³ + φ⁵ + φ⁷ + φ⁹ + φ¹⁰. The odd powers from φ¹ to
φ⁹ sum to 1 − φ¹⁰ (geometric series with ratio φ², using (A)); adding φ¹⁰
gives exactly 1. ✓

Same for y:

```
y:  0,  φ²,  φ²+φ⁶,  φ²+φ⁶+φ¹⁰,  φ²+φ⁶+φ⁹,  φ²+φ⁵,  φ
rows:  φ²,  φ⁶,  φ¹⁰,  φ¹¹,  φ⁸,  φ⁴        (sum = φ ✓)
```

Each row is φ × the corresponding column. Divide through by φ and the row
list *is* the column list — which is why the CSS uses one custom property
for both.

Finally, confirm a placement is square. Cell 6 is `grid-area: 2 / 3 / 3 / 6`:
row 2 (height φ⁶) by columns 3–5 (widths φ⁹ + φ¹⁰ + φ⁷). Is φ⁹ + φ¹⁰ + φ⁷
equal to φ⁶? By (B), φ⁹ + φ¹⁰ = φ⁸, and φ⁸ + φ⁷ = φ⁶. ✓ Every placement
checks out the same way — that's what "the squares share edges" means when
you write it down.

Decimal values (6 places, which measured sub-pixel in a 528px container):

| power | value    |
|-------|----------|
| φ¹    | 0.618034 |
| φ³    | 0.236068 |
| φ⁵    | 0.090170 |
| φ⁷    | 0.034442 |
| φ⁹    | 0.013156 |
| φ¹⁰   | 0.008131 |

---

## The one-sentence version

The old engine drew one square and shrank copies of it; the new engine
notices that all the squares line up on six shared lines and just tells the
browser which lines each cell spans. Same picture, no shrinking — so pixels
inside cells are real pixels, and the browser does all the layout.
