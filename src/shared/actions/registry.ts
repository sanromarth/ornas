import { ActionDefinition, ActionHandler, ActionEnabledCheck, ActionCategory } from './types';

interface RegistryEntry {
  definition: ActionDefinition;
  handler: ActionHandler;
  enabled?: ActionEnabledCheck;
}

class ActionRegistry {
  private actions = new Map<string, RegistryEntry>();
  private listeners = new Set<() => void>();
  private cachedActions: ActionDefinition[] | null = null;

  register(definition: ActionDefinition, handler: ActionHandler, enabled?: ActionEnabledCheck): void {
    this.actions.set(definition.id, { definition, handler, enabled });
    this.cachedActions = null;
    this.notify();
  }

  unregister(id: string): void {
    if (this.actions.delete(id)) {
      this.cachedActions = null;
      this.notify();
    }
  }

  async execute(id: string): Promise<void> {
    const entry = this.actions.get(id);
    if (!entry) return;
    
    if (this.isEnabled(id)) {
      await entry.handler();
    }
  }

  getAction(id: string): ActionDefinition | undefined {
    return this.actions.get(id)?.definition;
  }

  getAllActions(): ActionDefinition[] {
    if (!this.cachedActions) {
      this.cachedActions = Array.from(this.actions.values()).map(entry => entry.definition);
    }
    return this.cachedActions;
  }

  getSnapshot(): ActionDefinition[] {
    return this.getAllActions();
  }

  getActionsByCategory(category: ActionCategory): ActionDefinition[] {
    return this.getAllActions().filter(action => action.category === category);
  }

  isEnabled(id: string): boolean {
    const entry = this.actions.get(id);
    if (!entry) return false;
    if (entry.enabled) {
      return entry.enabled();
    }
    return true;
  }

  search(query: string): ActionDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllActions().filter(action => 
      action.label.toLowerCase().includes(lowerQuery) ||
      (action.description && action.description.toLowerCase().includes(lowerQuery)) ||
      action.category.toLowerCase().includes(lowerQuery)
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const actionRegistry = new ActionRegistry();
