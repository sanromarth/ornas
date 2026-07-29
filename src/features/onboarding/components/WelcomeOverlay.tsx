/**
 * WelcomeOverlay — First-run experience for ORNAS.
 *
 * Shown exactly once, on the first launch, after which `ornas_welcomed` is
 * written to localStorage and the overlay never appears again.
 *
 * Design:
 *   - Appears as a modal overlay (z-dialog, dim backdrop)
 *   - 3 steps: What ORNAS does → Core workflow → Keyboard shortcuts
 *   - Each step is one screenful — no scrolling within the overlay
 *   - Step indicators: simple dots (accessible via aria-label)
 *   - Keyboard: Tab/Enter advance, Escape dismisses from any step
 *   - Dismiss: "Get started" on the last step, or × at any time
 *   - No confetti, no animation beyond the Dialog's existing fade-in
 *
 * First-run philosophy (FIRST_RUN_EXPERIENCE.md):
 *   "Teach by showing, not by reading."
 *   Each step shows a concrete interaction, not a wall of text.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clipboard, Search, Keyboard, ArrowRight, X, ListChecks } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { cn } from '../../../shared/lib/utils';

const STORAGE_KEY = 'ornas_welcomed';

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  icon: typeof Clipboard;
  title: string;
  body: string;
  hint?: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: Clipboard,
    title: 'Your clipboard, organized',
    body: 'ORNAS silently captures everything you copy — text, images, code, files, links — and keeps it safely on your device. Nothing leaves your machine.',
    hint: (
      <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
        <span>Works with</span>
        <span className="px-2 py-0.5 rounded border border-border bg-hover text-text-secondary text-[11px]">Ctrl C</span>
        <span>in any app, automatically</span>
      </div>
    ),
  },
  {
    icon: Search,
    title: 'Find anything instantly',
    body: 'Press Ctrl K or / to focus the search bar. Filter by type using the sidebar — All, Favorites, Pinned, Images, Code, Links, or Files.',
    hint: (
      <div className="flex items-center gap-2 text-[12px] text-text-tertiary flex-wrap justify-center">
        {[['Ctrl', 'K'], ['/']].map((combo, i) => (
          <span key={i} className="flex items-center gap-1">
            {combo.map((k, j) => (
              <kbd key={j} className="px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
                {k}
              </kbd>
            ))}
          </span>
        ))}
        <span>to search</span>
      </div>
    ),
  },
  {
    icon: Keyboard,
    title: 'Built for the keyboard',
    body: 'Use ↑ ↓ to navigate, Space to copy the selected clip back to your clipboard, Del to delete. Settings are at Ctrl ,',
    hint: (
      <div className="flex items-center gap-3 text-[12px] text-text-tertiary flex-wrap justify-center">
        {[
          { keys: ['↑', '↓'], label: 'navigate' },
          { keys: ['Space'], label: 'copy' },
          { keys: ['Del'], label: 'delete' },
        ].map(({ keys, label }) => (
          <span key={label} className="flex items-center gap-1">
            {keys.map((k) => (
              <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
                {k}
              </kbd>
            ))}
            <span className="ml-0.5">{label}</span>
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: ListChecks,
    title: 'Manage in bulk',
    body: 'Hold Shift or Ctrl to select multiple clips. A toolbar will appear to let you favorite, pin, or delete them all at once.',
    hint: (
      <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
          Shift
        </kbd>
        <span>or</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-surface border border-border rounded shadow-sm">
          Ctrl
        </kbd>
        <span>+ Click to multi-select</span>
      </div>
    ),
  },
];

// ── Step dot indicator ─────────────────────────────────────────────────────────

function StepDots({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Welcome steps">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Step ${i + 1} of ${total}`}
          className={cn(
            'h-1.5 rounded-full transition-all duration-200',
            i === active ? 'w-4 bg-primary' : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function WelcomeOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show if the user has never been welcomed
    if (!localStorage.getItem(STORAGE_KEY)) {
      setIsMounted(true);
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsMounted(false);
      localStorage.setItem(STORAGE_KEY, '1');
    }, 150);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  // Keyboard handler
  useEffect(() => {
    if (!isMounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'Enter') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isMounted, step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isMounted) return null;

  const { icon: Icon, title, body, hint } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return createPortal(
    <div
      className={cn(
        // ornas-dialog-backdrop: rgba(0,0,0,0.72) + blur(7px) — matches Dialog.tsx
        'ornas-dialog-backdrop fixed inset-0 z-dialog flex items-center justify-center',
        'transition-opacity duration-150',
        isVisible ? 'opacity-100' : 'opacity-0',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to ORNAS"
    >
      <div
        className={cn(
          // ornas-dialog-card: multi-layer elevation — matches Dialog.tsx card
          'ornas-dialog-card relative w-full max-w-[400px] mx-4 bg-surface border border-border rounded-xl',
          'transition-all duration-150',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label="Close welcome guide"
        >
          <X size={15} />
        </button>

        {/* Content */}
        <div className="p-8 pt-10 flex flex-col items-center text-center gap-5">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-selection border border-primary/20">
            <Icon size={22} className="text-primary" aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold text-text-primary tracking-tight">
              {title}
            </h2>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-[30ch] mx-auto">
              {body}
            </p>
          </div>

          {/* Keyboard hint */}
          {hint && (
            <div className="py-2.5 px-4 rounded-lg bg-hover border border-border w-full flex items-center justify-center min-h-[38px]">
              {hint}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between w-full pt-1">
            <StepDots total={STEPS.length} active={step} />

            <Button
              variant="primary"
              size="sm"
              onClick={next}
              className="gap-1.5 px-4"
              autoFocus
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ArrowRight size={14} />}
            </Button>
          </div>
        </div>

        {/* Step counter (screen reader) */}
        <span className="sr-only">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>
    </div>,
    document.body,
  );
}
