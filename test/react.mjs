#!/usr/bin/env node
// Renders the React wrapper to a string and checks the emitted markup
// matches the CSS API. Run: `node test/react.mjs`.
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Spiral, Cell } from "../react/index.js";

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.error("✗", msg); } };

const html = renderToStaticMarkup(
  h(Spiral, { reverse: true, gap: 8, transition: "background .3s", className: "demo", id: "s" },
    h(Cell, { scroll: true, className: "c1", contentClassName: "k" }, "A"),
    h(Cell, { scrollX: true }, "B"),
    h(Cell, { as: "section" }, "C"))
);

check(html.startsWith('<div class="nautilus nautilus--reverse demo" style="--nautilus-gap:8px;--nautilus-transition:background .3s" id="s"'), "container classes/style");
check(html.includes('<div class="nautilus__cell c1"><div class="nautilus__content nautilus__content--scroll k">A</div></div>'), "scroll cell");
check(html.includes('<div class="nautilus__cell"><div class="nautilus__content nautilus__content--scroll-x">B</div></div>'), "scroll-x cell");
check(html.includes('<section class="nautilus__cell"><div class="nautilus__content">C</div></section>'), "cell `as`");

const plain = renderToStaticMarkup(h(Spiral, { portrait: true, auto: true, noFill: true, heroRotate: true, gap: "1cqi" }, h(Cell, null, "x")));
check(plain.startsWith('<div class="nautilus nautilus--portrait nautilus--auto nautilus--no-fill nautilus--hero-rotate" style="--nautilus-gap:1cqi"'), "all modifiers + string gap");
check(renderToStaticMarkup(h(Spiral, null)).startsWith('<div class="nautilus"'), "no style attribute when no knobs"); // React omits empty style

if (fails) { console.error(`\n${fails} check(s) failed\n${html}`); process.exit(1); }
console.log("✓ react wrapper: props → classes and custom properties as expected");
