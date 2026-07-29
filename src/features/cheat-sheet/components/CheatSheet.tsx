import { useState, useMemo } from 'react';
import { Search, Settings } from 'lucide-react';
import { Dialog } from '../../../shared/components/Dialog';
import { useUIStore } from '../../../stores/ui-store';
import { useActionRegistry, ActionIcon, type ActionDefinition } from '../../../shared/actions';
import { useShortcutRegistry, comboToParts } from '../../../shared/shortcuts';


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

export function CheatSheet() {
  const isOpen = useUIStore((state) => state.cheatSheetOpen);
  const toggleCheatSheet = useUIStore((state) => state.toggleCheatSheet);
  const openSettings = useUIStore((state) => state.openSettings);

  const { actions } = useActionRegistry();
  const { getBinding } = useShortcutRegistry();
  const [query, setQuery] = useState('');

  // Filter actions that have shortcut bindings or match search
  const filteredActions = useMemo(() => {
    const q = query.toLowerCase().trim();
    return actions.filter((action) => {
      const binding = getBinding(action.id);
      if (!q && !binding) return false; // Hide unbound actions when not searching

      const matchLabel = action.label.toLowerCase().includes(q);
      const matchDesc = action.description?.toLowerCase().includes(q) ?? false;
      const matchCat = CATEGORY_LABELS[action.category]?.toLowerCase().includes(q) ?? false;
      
      let matchKeys = false;
      if (binding) {
        const parts = comboToParts(binding.primary);
        matchKeys = parts.some((p) => p.toLowerCase().includes(q));
      }

      return matchLabel || matchDesc || matchCat || matchKeys;
    });
  }, [actions, getBinding, query]);

  // Group by category
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

  const handleOpenSettings = () => {
    toggleCheatSheet();
    openSettings('shortcuts');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={toggleCheatSheet}
      title="Keyboard Shortcuts Reference"
      className="max-w-[720px]"
    >
      <div className="flex flex-col gap-4">
        {/* Search Header */}
        <div className="relative flex items-center">
          <Search size={16} className="absolute text-text-tertiary pointer-events-none" style={{ left: '1rem' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shortcuts by name or key (e.g. 'copy', 'Ctrl', 'Enter')…"
            className="w-full h-9 pr-4 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-secondary"
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Shortcuts List */}
        <div className="max-h-[480px] overflow-y-auto pr-1 space-y-5 divide-y divide-border/40">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-tertiary">
              No matching keyboard shortcuts found.
            </div>
          ) : (
            groupedActions.map((group) => (
              <div key={group.category} className="pt-4 first:pt-0">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
                  {group.label}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map((action) => {
                    const binding = getBinding(action.id);
                    const primaryParts = binding ? comboToParts(binding.primary) : [];
                    const secondaryParts = binding?.secondary ? comboToParts(binding.secondary) : [];

                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-surface-hover/30 border border-border/40 hover:bg-surface-hover/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <ActionIcon name={action.iconName} size={15} className="text-text-secondary shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-text-primary truncate">
                              {action.label}
                            </div>
                            {action.description && (
                              <div className="text-[11px] text-text-tertiary truncate">
                                {action.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {primaryParts.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {primaryParts.map((part, idx) => (
                                <kbd
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-background border border-border rounded text-text-primary shadow-xs"
                                >
                                  {part}
                                </kbd>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-text-tertiary italic">Unbound</span>
                          )}

                          {secondaryParts.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-text-tertiary uppercase">or</span>
                              {secondaryParts.map((part, idx) => (
                                <kbd
                                  key={idx}
                                  className="px-1 py-0.5 text-[9px] font-mono bg-background/50 border border-border/60 rounded text-text-secondary"
                                >
                                  {part}
                                </kbd>
                              ))}
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-tertiary">
          <span>Press <kbd className="px-1 font-mono bg-surface border border-border rounded">?</kbd> or <kbd className="px-1 font-mono bg-surface border border-border rounded">Ctrl+/</kbd> anytime to toggle this reference.</span>
          <button
            onClick={handleOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-text-primary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
          >
            <Settings size={13} />
            <span>Customize Shortcuts</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
