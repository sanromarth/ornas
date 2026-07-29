import React from 'react';
import { ClipDto } from '../../../shared/types';
import { cn } from '../../../shared/lib/utils';

interface MonospacePreviewProps {
  clip: ClipDto;
}

export const MonospacePreview = React.memo(function MonospacePreview({ clip }: MonospacePreviewProps) {
  const content = clip.content_text ?? clip.preview ?? '';

  // Determine standard vs wrapping based on content type
  // Logs often benefit from wrapping, whereas diffs benefit from horizontal scrolling
  const isDiff = clip.category === 'diff';
  
  return (
    <div className="absolute inset-0 overflow-auto bg-background">
      <div className="min-h-full p-6">
        <div className={cn(
          "mx-auto select-text font-mono text-[12px] md:text-[13px] leading-relaxed text-text-secondary bg-surface border border-border rounded-md p-4",
          isDiff ? "w-max min-w-full" : "max-w-[100ch] whitespace-pre-wrap break-words"
        )}>
          {isDiff ? (
            <pre className="whitespace-pre m-0 p-0">{content}</pre>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
});
