/**
 * EmptyState — Shared empty-state component.
 *
 * Used in:
 *   - ClipboardList (empty clipboard, no search results)
 *   - ClipboardPreview (no clip selected)
 *   - Future collection/tag views
 *
 * Design:
 *   - Icon: small (18px), muted, in a plain square container — no heavy circular border
 *   - Title: text-[15px] font-medium — readable but not shouting
 *   - Description: text-[13px] text-text-tertiary — clearly secondary
 *   - Action: optional slot for kbd hints or CTA buttons
 *   - No animation — empty states should be calm, not distracting
 */

import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center h-full gap-3',
        className,
      )}
    >
      {/* Icon container — subtle, does not compete with content */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hover border border-border mb-1">
        <Icon size={18} className="text-text-tertiary" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[15px] font-medium text-text-primary tracking-tight">{title}</h3>
        <p className="text-[13px] text-text-tertiary max-w-[26ch] mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
