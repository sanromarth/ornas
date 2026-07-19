/** VirtualList — wrapper around TanStack Virtual for performant lists. */
import React from 'react';

interface Props<T> {
  items: T[];
  estimateSize: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/** Placeholder — will integrate @tanstack/react-virtual in Milestone 1. */
export function VirtualList<T>({ items, renderItem }: Props<T>) {
  return <div data-testid="virtual-list">{items.map((item, i) => renderItem(item, i))}</div>;
}
