/** Tooltip — lightweight hover tooltip. */
import React from 'react';

interface Props { content: string; children: React.ReactNode; }

export function Tooltip({ content, children }: Props) {
  return <div title={content}>{children}</div>;
}
