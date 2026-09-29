import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";

export interface SpiralProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Element to render. Default `"div"`. */
  as?: ElementType;
  /** Mirror horizontally — the spiral coils in from the left. */
  reverse?: boolean;
  /** Tall golden rectangle (1 : 1.618). */
  portrait?: boolean;
  /** Switch to portrait automatically when the container is taller than wide. */
  auto?: boolean;
  /** Keep the last cell square, leaving the wedge at the eye visible. */
  noFill?: boolean;
  /** Pre-rotate each cell's content by 90° × index, for zoom scenes. */
  heroRotate?: boolean;
  /** Visible gutter between cells. A number is px. Sets `--nautilus-gap`. */
  gap?: number | string;
  /** Sets `--nautilus-transition`, e.g. `"background 0.4s ease"`. */
  transition?: string;
  style?: CSSProperties & Record<`--${string}`, string | number>;
  /** Up to 10 `<Cell>`s. */
  children?: ReactNode;
}

export interface CellProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Element to render for the cell. Default `"div"`. */
  as?: ElementType;
  /** Vertical scroll container. */
  scroll?: boolean;
  /** Horizontal scroll container. */
  scrollX?: boolean;
  /** Class for the inner `.nautilus__content` wrapper. */
  contentClassName?: string;
  /** Style for the inner `.nautilus__content` wrapper. */
  contentStyle?: CSSProperties;
  children?: ReactNode;
}

export const Spiral: ForwardRefExoticComponent<SpiralProps & RefAttributes<HTMLElement>>;
export const Cell: ForwardRefExoticComponent<CellProps & RefAttributes<HTMLElement>>;
