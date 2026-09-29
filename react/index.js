// nautilus-grid/react — thin React wrapper over the CSS.
// Maps props to the .spiral-grid BEM classes and custom properties, and
// enforces the cell/content two-div structure. No runtime logic beyond that.
// Plain createElement so the package needs no build step; import the CSS
// yourself: `import "nautilus-grid";`

import { createElement, forwardRef } from "react";

const cx = (...parts) => parts.filter(Boolean).join(" ");

export const Spiral = forwardRef(function Spiral(
  { as = "div", reverse, portrait, auto, noFill, heroRotate, gap, transition, className, style, ...rest },
  ref
) {
  return createElement(as, {
    ref,
    className: cx(
      "spiral-grid",
      reverse && "spiral-grid--reverse",
      portrait && "spiral-grid--portrait",
      auto && "spiral-grid--auto",
      noFill && "spiral-grid--no-fill",
      heroRotate && "spiral-grid--hero-rotate",
      className
    ),
    style: {
      ...(gap != null && { "--spiral-grid-gap": typeof gap === "number" ? `${gap}px` : gap }),
      ...(transition != null && { "--spiral-grid-transition": transition }),
      ...style,
    },
    ...rest,
  });
});

export const Cell = forwardRef(function Cell(
  { as = "div", scroll, scrollX, className, contentClassName, style, contentStyle, children, ...rest },
  ref
) {
  return createElement(
    as,
    { ref, className: cx("spiral-grid__cell", className), style, ...rest },
    createElement(
      "div",
      {
        className: cx(
          "spiral-grid__content",
          scroll && "spiral-grid__content--scroll",
          scrollX && "spiral-grid__content--scroll-x",
          contentClassName
        ),
        style: contentStyle,
      },
      children
    )
  );
});
