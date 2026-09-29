// nautilus-grid/react — thin React wrapper over the CSS.
// Maps props to the .nautilus BEM classes and custom properties, and
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
      "nautilus",
      reverse && "nautilus--reverse",
      portrait && "nautilus--portrait",
      auto && "nautilus--auto",
      noFill && "nautilus--no-fill",
      heroRotate && "nautilus--hero-rotate",
      className
    ),
    style: {
      ...(gap != null && { "--nautilus-gap": typeof gap === "number" ? `${gap}px` : gap }),
      ...(transition != null && { "--nautilus-transition": transition }),
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
    { ref, className: cx("nautilus__cell", className), style, ...rest },
    createElement(
      "div",
      {
        className: cx(
          "nautilus__content",
          scroll && "nautilus__content--scroll",
          scrollX && "nautilus__content--scroll-x",
          contentClassName
        ),
        style: contentStyle,
      },
      children
    )
  );
});
