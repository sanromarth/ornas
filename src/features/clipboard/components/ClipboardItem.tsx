/** ClipboardItem — a single row in the clipboard list. */

import React from 'react';
import type { Clip } from '../../../shared/types';

interface Props {
  clip: Clip;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

/** Renders a single clipboard entry row with preview and metadata. */
export const ClipboardItem = React.memo(function ClipboardItem({ clip, isSelected, onSelect }: Props) {
  return (
    <div
      data-testid={`clip-${clip.id}`}
      className={isSelected ? 'selected' : ''}
      onClick={() => onSelect(clip.id)}
      role="option"
      aria-selected={isSelected}
    >
      {clip.preview ?? clip.content_type}
    </div>
  );
});
