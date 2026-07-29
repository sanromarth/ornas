import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Lock, RotateCcw, Download, Upload, AlertTriangle, X, Keyboard
} from 'lucide-react';
import { useActionRegistry, ActionIcon, type ActionDefinition } from '../../../shared/actions';
import { useShortcutRegistry, comboToParts, eventToCombo, formatCombo, type KeyCombo } from '../../../shared/shortcuts';
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

interface ConflictState {
  targetAction: ActionDefinition;
  combo: KeyCombo;
  conflictingActionId: string;
  conflictingActionLabel: string;
}

export function ShortcutsSection() {
  const { actions } = useActionRegistry();
  const {
    overrides, getBinding, checkConflict, setCustomBinding, forceSetBinding,
    resetBinding, resetAll, exportOverrides, importOverrides
  } = useShortcutRegistry();

  const [query, setQuery] = useState('');
  const [capturingActionId, setCapturingActionId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const overrideIds = useMemo(() => new Set(overrides.map(o => o.actionId)), [overrides]);

  const filteredActions = useMemo(() => {
    const q = query.toLowerCase().trim();
    return actions.filter((action) => {
      const binding = getBinding(action.id);
      if (!binding) return false; // Only show shortcut-capable actions in settings

      if (!q) return true;

      const matchLabel = action.label.toLowerCase().includes(q);
      const matchDesc = action.description?.toLowerCase().includes(q) ?? false;
      const matchCat = CATEGORY_LABELS[action.category]?.toLowerCase().includes(q) ?? false;
      
      const parts = comboToParts(binding.primary);
      const matchKeys = parts.some((p) => p.toLowerCase().includes(q));

      return matchLabel || matchDesc || matchCat || matchKeys;
    });
  }, [actions, getBinding, query]);

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

  useEffect(() => {
    if (!capturingActionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check for standalone escape to cancel
      if (e.key === 'Escape' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        setCapturingActionId(null);
        return;
      }

      // Check for Backspace or Delete to reset/unbind
      if ((e.key === 'Backspace' || e.key === 'Delete') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        resetBinding(capturingActionId);
        setCapturingActionId(null);
        return;
      }

      const combo = eventToCombo(e);
      if (!combo) return; // Modifier key pressed alone

      const targetAction = actions.find((a) => a.id === capturingActionId);
      if (!targetAction) {
        setCapturingActionId(null);
        return;
      }

      const res = checkConflict(capturingActionId, combo);
      if (res.hasConflict && res.conflictingActionId) {
        const conflictingAction = actions.find((a) => a.id === res.conflictingActionId);
        setConflict({
          targetAction,
          combo,
          conflictingActionId: res.conflictingActionId,
          conflictingActionLabel: conflictingAction ? conflictingAction.label : res.conflictingActionId,
        });
        setCapturingActionId(null);
      } else {
        setCustomBinding({ actionId: capturingActionId, primary: combo });
        setCapturingActionId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [capturingActionId, actions, checkConflict, setCustomBinding, resetBinding]);

  const handleResolveConflict = (replace: boolean) => {
    if (replace && conflict) {
      forceSetBinding({ actionId: conflict.targetAction.id, primary: conflict.combo });
    }
    setConflict(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(exportOverrides(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ornas-shortcuts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid shortcuts format: expected JSON array.');
        }
        importOverrides(parsed);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import shortcuts');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-7 pb-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Keyboard size={18} className="text-text-secondary" />
            <span>Keyboard Shortcuts</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Click any shortcut badge to rebind it. Press <kbd className="font-mono bg-surface border border-border px-1 rounded">Esc</kbd> to cancel or <kbd className="font-mono bg-surface border border-border px-1 rounded">Backspace</kbd> to reset.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExport}
            disabled={overrides.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Export customized shortcuts to JSON"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          <button
            onClick={handleImportClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
            title="Import shortcuts from JSON"
          >
            <Upload size={13} />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={resetAll}
            disabled={overrides.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
            title="Reset all shortcuts to system defaults"
          >
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-destructive hover:underline">Dismiss</button>
        </div>
      )}

      {/* Conflict Modal / Inline Alert */}
      {conflict && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-lg text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-text-primary">Shortcut Conflict Detected</div>
              <div className="text-text-secondary leading-relaxed">
                The shortcut <kbd className="font-mono font-bold bg-background px-1.5 py-0.5 rounded border border-border">{formatCombo(conflict.combo)}</kbd> is already assigned to <span className="font-medium text-text-primary">"{conflict.conflictingActionLabel}"</span>.
              </div>
              <div className="text-text-tertiary">
                Do you want to reassign this shortcut to <span className="font-medium text-text-primary">"{conflict.targetAction.label}"</span>?
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => handleResolveConflict(false)}
              className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-surface-hover rounded border border-border transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResolveConflict(true)}
              className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors"
            >
              Replace and Reassign
            </button>
          </div>
        </div>
      )}

      {/* Search Filter with vertical breathing room */}
      <div className="relative flex items-center pt-1 pb-1">
        <Search size={16} className="absolute text-text-tertiary pointer-events-none" style={{ left: '1rem' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter shortcuts by command name, category, or key..."
          className="w-full h-9 pr-4 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-secondary shadow-sm transition-colors"
          style={{ paddingLeft: '2.75rem' }}
        />
      </div>

      {/* Shortcuts Grouped List */}
      <div className="space-y-8">
        {actions.length === 0 ? (
          <div className="py-12 text-center space-y-3 border border-border/60 rounded-lg bg-surface/30 p-6">
            <AlertTriangle size={24} className="mx-auto text-amber-500" />
            <div className="text-sm font-medium text-text-primary">Shortcut Registry Not Loaded</div>
            <p className="text-xs text-text-tertiary max-w-sm mx-auto">
              The action registry is currently empty or still initializing. If this persists, try reloading the application or resetting shortcuts.
            </p>
            <button
              onClick={resetAll}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Shortcuts</span>
            </button>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-tertiary">
            No matching shortcuts found.
          </div>
        ) : (
          groupedActions.map((group) => (
            <div key={group.category} className="space-y-2 pt-1 first:pt-0">
              <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider px-1 pb-1 border-b border-border/40">
                {group.label}
              </h3>
              <div className="divide-y divide-border/40 border border-border/60 rounded-lg bg-surface/30 overflow-hidden">
                {group.items.map((action) => {
                  const binding = getBinding(action.id);
                  const isCapturing = capturingActionId === action.id;
                  const isCustomized = overrideIds.has(action.id);
                  const isLocked = binding?.locked;
                  const parts = binding ? comboToParts(binding.primary) : [];

                  return (
                    <div
                      key={action.id}
                      className={cn(
                        "flex items-center justify-between p-3 text-sm transition-colors",
                        isCapturing ? "bg-primary/10 border-l-2 border-l-primary shadow-sm" : "hover:bg-surface-hover/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <ActionIcon name={action.iconName} size={16} className="text-text-secondary shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary truncate">{action.label}</div>
                          {action.description && (
                            <div className="text-xs text-text-tertiary truncate">{action.description}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isLocked ? (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-normal text-text-tertiary/60 select-none cursor-default" title="System shortcut cannot be customized">
                            <Lock size={11} className="opacity-70" />
                            <span>Locked</span>
                          </div>
                        ) : isCapturing ? (
                          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-primary/15 border border-primary text-primary rounded-md text-xs font-medium animate-pulse shadow-sm">
                            <span className="font-semibold tracking-wide">Press a new shortcut...</span>
                            <span className="text-[11px] opacity-80 font-mono hidden sm:inline"><kbd className="font-bold">Esc</kbd> = Cancel</span>
                            <span className="text-[11px] opacity-80 font-mono hidden sm:inline"><kbd className="font-bold">Backspace</kbd> = Reset</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCapturingActionId(null); }}
                              className="p-0.5 hover:bg-primary/20 rounded ml-0.5 text-primary"
                              title="Cancel capture"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isCustomized && (
                              <button
                                onClick={() => resetBinding(action.id)}
                                className="p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                                title="Reset to default shortcut"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => setCapturingActionId(action.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-background hover:bg-surface-hover border border-border hover:border-text-secondary rounded-md transition-all cursor-pointer group"
                              title="Click to rebind this shortcut"
                            >
                              {parts.length > 0 ? (
                                parts.map((part, idx) => (
                                  <kbd
                                    key={idx}
                                    className="text-xs font-mono font-medium text-text-primary group-hover:text-accent-foreground"
                                  >
                                    {part}
                                  </kbd>
                                ))
                              ) : (
                                <span className="text-xs text-text-tertiary italic">Unbound</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
