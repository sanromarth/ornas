import type { ShortcutBinding, ShortcutOverride, KeyCombo, ConflictResult } from './types';
import { DEFAULT_SHORTCUTS } from './defaults';
import { matchEvent as testEventMatch, combosEqual } from './matcher';

type Listener = () => void;

class ShortcutRegistry {
  private bindings: Map<string, ShortcutBinding> = new Map();
  private overrides: Map<string, ShortcutOverride> = new Map();
  private listeners: Set<Listener> = new Set();
  private cachedBindings: ShortcutBinding[] | null = null;
  private cachedOverrides: ShortcutOverride[] | null = null;
  private version = 0;

  constructor() {
    this.reset();
  }

  private notify() {
    this.cachedBindings = null;
    this.cachedOverrides = null;
    this.version++;
    this.listeners.forEach(l => l());
  }

  reset() {
    this.bindings.clear();
    this.overrides.clear();
    
    for (const def of DEFAULT_SHORTCUTS) {
      this.bindings.set(def.actionId, { ...def });
    }
    this.notify();
  }

  resetBinding(actionId: string) {
    this.overrides.delete(actionId);
    this.notify();
  }

  getBinding(actionId: string): ShortcutBinding | undefined {
    const defaultBinding = this.bindings.get(actionId);
    if (!defaultBinding) return undefined;

    const override = this.overrides.get(actionId);
    if (!override || defaultBinding.locked) return defaultBinding;

    const result = { ...defaultBinding };
    if (override.primary) result.primary = override.primary;
    if (override.secondary !== undefined) {
      result.secondary = override.secondary === null ? undefined : override.secondary;
    }
    return result;
  }

  getAllBindings(): ShortcutBinding[] {
    if (!this.cachedBindings) {
      this.cachedBindings = Array.from(this.bindings.keys())
        .map(id => this.getBinding(id)!)
        .filter(Boolean);
    }
    return this.cachedBindings;
  }

  checkConflict(actionId: string, combo: KeyCombo): ConflictResult {
    const all = this.getAllBindings();
    for (const b of all) {
      if (b.actionId === actionId) continue;
      
      if (combosEqual(b.primary, combo)) {
        return { hasConflict: true, conflictingActionId: b.actionId };
      }
      if (b.secondary && combosEqual(b.secondary, combo)) {
        return { hasConflict: true, conflictingActionId: b.actionId };
      }
    }
    return { hasConflict: false };
  }

  setCustomBinding(override: ShortcutOverride): ConflictResult {
    const binding = this.bindings.get(override.actionId);
    if (binding?.locked) return { hasConflict: false };

    if (override.primary) {
      const conflict = this.checkConflict(override.actionId, override.primary);
      if (conflict.hasConflict) return conflict;
    }
    if (override.secondary) {
      const conflict = this.checkConflict(override.actionId, override.secondary);
      if (conflict.hasConflict) return conflict;
    }

    this.overrides.set(override.actionId, override);
    this.notify();
    return { hasConflict: false };
  }

  forceSetBinding(override: ShortcutOverride) {
    const binding = this.bindings.get(override.actionId);
    if (binding?.locked) return;

    if (override.primary) {
      const conflict = this.checkConflict(override.actionId, override.primary);
      if (conflict.hasConflict && conflict.conflictingActionId) {
        this.clearComboFromAction(conflict.conflictingActionId, override.primary);
      }
    }
    if (override.secondary) {
      const conflict = this.checkConflict(override.actionId, override.secondary);
      if (conflict.hasConflict && conflict.conflictingActionId) {
        this.clearComboFromAction(conflict.conflictingActionId, override.secondary);
      }
    }

    this.overrides.set(override.actionId, override);
    this.notify();
  }

  private clearComboFromAction(actionId: string, combo: KeyCombo) {
    const binding = this.getBinding(actionId);
    if (!binding || binding.locked) return;

    const newOverride: ShortcutOverride = this.overrides.get(actionId) || { actionId };
    
    if (combosEqual(binding.primary, combo)) {
      if (binding.secondary && !combosEqual(binding.secondary, combo)) {
        newOverride.primary = binding.secondary;
        newOverride.secondary = null;
      } else {
        // Unbind the primary
        newOverride.primary = { key: 'unbound' };
      }
    } else if (binding.secondary && combosEqual(binding.secondary, combo)) {
      newOverride.secondary = null;
    }
    
    this.overrides.set(actionId, newOverride);
  }

  matchEvent(event: KeyboardEvent): string | null {
    for (const b of this.getAllBindings()) {
      if (testEventMatch(event, b.primary)) return b.actionId;
      if (b.secondary && testEventMatch(event, b.secondary)) return b.actionId;
    }
    return null;
  }

  exportOverrides(): ShortcutOverride[] {
    if (!this.cachedOverrides) {
      this.cachedOverrides = Array.from(this.overrides.values());
    }
    return this.cachedOverrides;
  }

  importOverrides(overrides: ShortcutOverride[]) {
    for (const o of overrides) {
      this.overrides.set(o.actionId, o);
    }
    this.notify();
  }

  loadFromSettings(json: string) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        this.importOverrides(parsed);
      }
    } catch (e) {
      console.error('Failed to parse shortcuts', e);
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): number {
    return this.version;
  }
}

export const shortcutRegistry = new ShortcutRegistry();
