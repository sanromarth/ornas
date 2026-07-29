import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { CodeSnippetPreview } from './CodeSnippetPreview';
import { ClipDto } from '../../../shared/types';
import { Code, Layout } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

interface HTMLPreviewProps {
  clip: ClipDto;
}

export const HTMLPreview = React.memo(function HTMLPreview({ clip }: HTMLPreviewProps) {
  const [showSource, setShowSource] = useState(false);

  // We rely on backend payload for content_html, fallback to plain text if not available somehow
  const htmlContent = clip.content_html || clip.content_text || '';

  // Sanitize the HTML payload safely.
  // We forbid scripts, iframes, objects, forms to keep it strictly display-only.
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'del', 'ins', 'sub', 'sup', 'hr'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* View Toggle */}
      <div className="shrink-0 h-10 border-b border-border flex items-center px-4 bg-surface z-10 sticky top-0">
        <div className="flex bg-hover rounded-md p-0.5">
          <button
            onClick={() => setShowSource(false)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium transition-colors",
              !showSource
                ? "bg-background text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Layout size={13} />
            Preview
          </button>
          <button
            onClick={() => setShowSource(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium transition-colors",
              showSource
                ? "bg-background text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Code size={13} />
            Source
          </button>
        </div>
      </div>

      {/* Content Area */}
      {showSource ? (
        <div className="flex-1 overflow-hidden">
          <CodeSnippetPreview clip={{ ...clip, language: 'html', content_text: htmlContent }} forceLanguage="html" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <div
            className="max-w-[80ch] mx-auto prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 break-words bg-background select-text"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        </div>
      )}
    </div>
  );
});
