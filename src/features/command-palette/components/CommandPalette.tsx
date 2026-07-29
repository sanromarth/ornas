import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useUIStore } from '../../../stores/ui-store';
import { useActionRegistry, actionRegistry, ActionIcon, type ActionDefinition } from '../../../shared/actions';
import { useShortcutRegistry, comboToParts } from '../../../shared/shortcuts';
import { cn } from '../../../shared/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  navigation: 'Navigation',
  clipboard: 'Clipboard',
  search: 'Search',
  preview: 'Preview',
  collections: 'Collections & Filters',
  editing: 'Editing',
  developer: 'Developer',
  system: 'System',
};

export function CommandPalette() {
  const isOpen = useUIStore((state) => state.commandPaletteOpen);
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
  
  const { actions } = useActionRegistry();
  const { getBinding } = useShortcutRegistry();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query and selection when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter actions based on search query
  const filteredActions = useMemo(() => {
    if (!query.trim()) {
      return actions;
    }
    const q = query.toLowerCase().trim();
    return actions.filter((action) => {
      const matchLabel = action.label.toLowerCase().includes(q);
      const matchDesc = action.description?.toLowerCase().includes(q) ?? false;
      const matchCat = CATEGORY_LABELS[action.category]?.toLowerCase().includes(q) ?? false;
      return matchLabel || matchDesc || matchCat;
    });
  }, [actions, query]);

  // Group actions by category
  const groupedActions = useMemo(() => {
    const groups: { category: string; label: string; items: ActionDefinition[] }[] = [];
    const map = new Map<string, ActionDefinition[]>();

    for (const action of filteredActions) {
      if (!map.has(action.category)) {
        map.set(action.category, []);
      }
      map.get(action.category)!.push(action);
    }

    for (const [cat, items] of map.entries()) {
      groups.push({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        items,
      });
    }

    return groups;
  }, [filteredActions]);

  // Ensure selectedIndex is valid when results change
  useEffect(() => {
    if (selectedIndex >= filteredActions.length && filteredActions.length > 0) {
      setSelectedIndex(filteredActions.length - 1);
    } else if (filteredActions.length === 0) {
      setSelectedIndex(0);
    }
  }, [filteredActions.length, selectedIndex]);

  // Execute an action and close palette
  const handleExecute = useCallback((action: ActionDefinition) => {
    if (!actionRegistry.isEnabled(action.id)) return;
    toggleCommandPalette();
    setTimeout(() => {
      actionRegistry.execute(action.id).catch((err) => {
        console.error(`[CommandPalette] Failed to execute action "${action.id}":`, err);
      });
    }, 10);
  }, [toggleCommandPalette]);

  // Handle keyboard navigation inside the command palette
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      toggleCommandPalette();
      return;
    }

    if (filteredActions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedAction = filteredActions[selectedIndex];
      if (selectedAction) {
        handleExecute(selectedAction);
      }
    }
  }, [filteredActions, selectedIndex, toggleCommandPalette, handleExecute]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const selectedEl = listRef.current.querySelector('[data-selected="true"]') as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-[ornas-fade-in_150ms_ease-out_both]"
      onClick={toggleCommandPalette}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col",
          "animate-[ornas-scale-in_150ms_var(--ease-snappy)_both]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 h-14 border-b border-border gap-3">
          <Search size={18} className="text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions…"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-surface rounded border border-border shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto py-2 divide-y divide-border/40">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-tertiary">
              No matching actions found.
            </div>
          ) : (
            groupedActions.map((group) => (
              <div key={group.category} className="py-1.5 first:pt-0 last:pb-0">
                <div className="px-3 py-1 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5 px-1.5">
                  {group.items.map((action) => {
                    const itemIndex = currentIndex++;
                    const isSelected = itemIndex === selectedIndex;
                    const isEnabled = actionRegistry.isEnabled(action.id);
                    const binding = getBinding(action.id);
                    const badgeParts = binding ? comboToParts(binding.primary) : [];

                    return (
                      <div
                        key={action.id}
                        data-selected={isSelected}
                        onClick={() => handleExecute(action)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                          isSelected ? "bg-selection text-primary" : "text-text-primary hover:bg-hover",
                          !isEnabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ActionIcon
                            name={action.iconName}
                            size={16}
                            className={cn(
                              "shrink-0",
                              isSelected ? "text-primary" : "text-text-secondary"
                            )}
                          />
                          <span className="font-medium truncate">{action.label}</span>
                          {action.description && (
                            <span
                              className={cn(
                                "text-xs truncate hidden sm:inline",
                                isSelected ? "text-primary/80" : "text-text-tertiary"
                              )}
                            >
                              — {action.description}
                            </span>
                          )}
                        </div>

                        {badgeParts.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            {badgeParts.map((part, idx) => (
                              <kbd
                                key={idx}
                                className={cn(
                                  "px-1.5 py-0.5 text-[11px] font-mono rounded border",
                                  isSelected
                                    ? "bg-primary/15 border-primary/25 text-primary"
                                    : "bg-background border-border text-text-secondary"
                                )}
                              >
                                {part}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-hover/30 border-t border-border text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono">Enter</kbd> to select</span>
          </div>
          <span>{filteredActions.length} action{filteredActions.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
