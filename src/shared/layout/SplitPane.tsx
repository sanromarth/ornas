import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface SplitPaneProps {
  leftPane: ReactNode;
  rightPane: ReactNode;
  defaultSplit?: number; // percentage
  minLeftWidth?: number;
  minRightWidth?: number;
  className?: string;
}

export function SplitPane({
  leftPane,
  rightPane,
  defaultSplit = 35,
  minLeftWidth = 280,
  minRightWidth = 400,
  className
}: SplitPaneProps) {
  const [splitPos, setSplitPos] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // TODO: Persist divider position

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let newSplit = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      const leftWidth = (newSplit / 100) * containerRect.width;
      const rightWidth = containerRect.width - leftWidth;

      if (leftWidth < minLeftWidth) {
        newSplit = (minLeftWidth / containerRect.width) * 100;
      } else if (rightWidth < minRightWidth) {
        newSplit = ((containerRect.width - minRightWidth) / containerRect.width) * 100;
      }

      setSplitPos(newSplit);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minLeftWidth, minRightWidth]);

  return (
    <div ref={containerRef} className={cn("flex flex-1 overflow-hidden relative w-full h-full", className)}>
      <div 
        className="flex h-full overflow-hidden"
        style={{ width: `${splitPos}%` }}
      >
        {leftPane}
      </div>
      
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "relative flex items-center justify-center w-px bg-border cursor-col-resize transition-all duration-100 ease-out z-10 -mx-[0.5px]",
          isDragging ? "bg-primary w-1" : "hover:bg-primary/50 hover:w-1"
        )}
        onMouseDown={handleMouseDown}
      >
        {isDragging && (
          <div className="absolute inset-y-0 -inset-x-8 z-50" />
        )}
      </div>

      <div 
        className="flex h-full overflow-hidden"
        style={{ width: `${100 - splitPos}%` }}
      >
        {rightPane}
      </div>
    </div>
  );
}
