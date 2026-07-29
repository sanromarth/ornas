/**
 * useResizablePanel — Custom hook for drag-to-resize panel behavior.
 *
 * Manages a single panel width with:
 * - Mouse drag resizing
 * - Min/max constraints
 * - localStorage persistence
 * - Collapse/expand toggle
 *
 * Design Principles satisfied:
 * - Desktop First: Native drag-to-resize, a core desktop paradigm.
 * - Performance First: Uses refs for drag state to avoid React rerenders during drag.
 * - Privacy First: Persists to localStorage only, never leaves the machine.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseResizablePanelOptions {
  /** localStorage key for persisting width */
  storageKey: string;
  /** Default width in pixels */
  defaultWidth: number;
  /** Minimum width in pixels */
  minWidth: number;
  /** Maximum width in pixels */
  maxWidth: number;
  /** Whether the panel can be collapsed (width goes to 0) */
  collapsible?: boolean;
  /** localStorage key for persisting collapsed state */
  collapsedStorageKey?: string;
}

interface UseResizablePanelReturn {
  /** Current width in pixels (0 when collapsed) */
  width: number;
  /** Whether the panel is currently collapsed */
  isCollapsed: boolean;
  /** Toggle collapsed state */
  toggleCollapsed: () => void;
  /** Set collapsed state explicitly */
  setCollapsed: (collapsed: boolean) => void;
  /** Props to spread onto the splitter handle element */
  splitterProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    'aria-valuenow': number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-label': string;
    /** Direction of resize: 'right' means dragging right edge */
    'data-direction': 'right';
  };
}

export function useResizablePanel({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  collapsible = false,
  collapsedStorageKey,
}: UseResizablePanelOptions): UseResizablePanelReturn {
  // Read initial width from localStorage
  const getInitialWidth = (): number => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    } catch {
      // localStorage not available
    }
    return defaultWidth;
  };

  const getInitialCollapsed = (): boolean => {
    if (!collapsible || !collapsedStorageKey) return false;
    try {
      return localStorage.getItem(collapsedStorageKey) === 'true';
    } catch {
      return false;
    }
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsed);

  // Refs for drag state — avoids React rerenders during mouse movement
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Persist width changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(width));
    } catch {
      // localStorage not available
    }
  }, [width, storageKey]);

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (collapsible && collapsedStorageKey) {
      try {
        localStorage.setItem(collapsedStorageKey, String(isCollapsed));
      } catch {
        // localStorage not available
      }
    }
  }, [isCollapsed, collapsible, collapsedStorageKey]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only respond to left-click
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      // Add cursor style to body during drag
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      let rafId: number | null = null;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = moveEvent.clientX - startX.current;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
        
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          setWidth(newWidth);
          rafId = null;
        });
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, minWidth, maxWidth]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 50 : 20;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setWidth((prev) => Math.min(maxWidth, prev + step));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setWidth((prev) => Math.max(minWidth, prev - step));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setWidth(minWidth);
      } else if (e.key === 'End') {
        e.preventDefault();
        setWidth(maxWidth);
      }
    },
    [minWidth, maxWidth]
  );

  const toggleCollapsed = useCallback(() => {
    if (!collapsible) return;
    setIsCollapsed((prev) => !prev);
  }, [collapsible]);

  const setCollapsedExplicit = useCallback(
    (collapsed: boolean) => {
      if (!collapsible) return;
      setIsCollapsed(collapsed);
    },
    [collapsible]
  );

  return {
    width: isCollapsed ? 0 : width,
    isCollapsed,
    toggleCollapsed,
    setCollapsed: setCollapsedExplicit,
    splitterProps: {
      onMouseDown: handleMouseDown,
      onKeyDown: handleKeyDown,
      'aria-valuenow': isCollapsed ? 0 : width,
      'aria-valuemin': minWidth,
      'aria-valuemax': maxWidth,
      'aria-label': 'Resize sidebar panel',
      'data-direction': 'right' as const,
    },
  };
}
