/**
 * PanelSplitter — A draggable divider between resizable panels.
 *
 * Renders as a thin vertical line (1px border) with an invisible
 * wider hit area (8px) for comfortable mouse targeting.
 *
 * Hover and active states use the accent color for visual feedback.
 *
 * Design Principles satisfied:
 * - Desktop First: A core desktop interaction pattern.
 * - Content First: Nearly invisible by default, never distracts from content.
 * - Performance First: Pure CSS hover/active states, zero JS overhead.
 */

import { cn } from '../lib/utils';

interface PanelSplitterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mouse event handlers from useResizablePanel */
  onMouseDown: (e: React.MouseEvent) => void;
  /** Optional additional className */
  className?: string;
}

export function PanelSplitter({ onMouseDown, className, ...props }: PanelSplitterProps) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      onMouseDown={onMouseDown}
      {...props}
      className={cn(
        // Layout: zero visible width, positioned between flex children
        "relative flex-shrink-0 w-0",
        // Hit area: 8px wide invisible zone centered on the 0-width element
        "before:content-[''] before:absolute before:inset-y-0 before:-left-[4px] before:w-[8px] before:z-10",
        // Cursor
        "before:cursor-col-resize cursor-col-resize",
        // Visual indicator: 1px line, visible only on hover/active
        "after:content-[''] after:absolute after:inset-y-0 after:left-0 after:w-px",
        "after:bg-border",
        "hover:after:bg-primary/50 active:after:bg-primary",
        // Transition
        "after:transition-colors after:duration-100",
        className
      )}
    />
  );
}
