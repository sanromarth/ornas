import { useState, useEffect, useRef } from 'react';
import { Dialog } from '../../../shared/components/Dialog';
import { Input } from '../../../shared/components/Input';
import { useSettings } from '../hooks/useSettings';
import { useUIStore } from '../../../stores/ui-store';
import { BackupSection } from './BackupSection';
import { VaultSection } from '../../vault/components/VaultSection';

import { useDebounce } from '../../../shared/hooks/useDebounce';
import { Check, ChevronDown } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { settings, isLoading, error, updateSetting } = useSettings();
  
  // Local state for edits (text inputs need local state for debouncing)
  const [retentionDays, setRetentionDays] = useState('');
  const [historyMaxSize, setHistoryMaxSize] = useState('');
  const [excludedApps, setExcludedApps] = useState('');
  
  // Track if a value was modified by the user
  const isDirty = useRef({
    retention: false,
    history: false,
    apps: false
  });
  
  // Debounced values
  const debouncedRetention = useDebounce(retentionDays, 500);
  const debouncedHistorySize = useDebounce(historyMaxSize, 500);
  const debouncedExcludedApps = useDebounce(excludedApps, 500);
  
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Sync downward ONLY if the user hasn't dirtied the local state
  useEffect(() => {
    if (settings) {
      if (!isDirty.current.retention) setRetentionDays(settings.retention_days ?? '90');
      if (!isDirty.current.history) setHistoryMaxSize(settings.history_max_size ?? '10000');
      if (!isDirty.current.apps) setExcludedApps(settings.excluded_apps ?? '');
    }
  }, [settings]);

  const showSavedIndicator = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  };

  // Upward syncs (only execute if the value is dirty and differs from backend)
  useEffect(() => {
    if (isDirty.current.retention && settings && debouncedRetention !== settings.retention_days) {
      updateSetting({ key: 'retention_days', value: debouncedRetention });
      showSavedIndicator('retention_days');
    }
  }, [debouncedRetention, settings, updateSetting]);

  useEffect(() => {
    if (isDirty.current.history && settings && debouncedHistorySize !== settings.history_max_size) {
      updateSetting({ key: 'history_max_size', value: debouncedHistorySize });
      showSavedIndicator('history_max_size');
    }
  }, [debouncedHistorySize, settings, updateSetting]);

  useEffect(() => {
    if (isDirty.current.apps && settings && debouncedExcludedApps !== settings.excluded_apps) {
      updateSetting({ key: 'excluded_apps', value: debouncedExcludedApps });
      showSavedIndicator('excluded_apps');
    }
  }, [debouncedExcludedApps, settings, updateSetting]);

  // Theme uses the source of truth directly (no local state or debouncing)
  const currentTheme = settings?.theme || 'system';
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSetting({ key: 'theme', value: e.target.value });
    showSavedIndicator('theme');
  };

  const { settingsOpen } = useUIStore();
  if (isLoading) return null;

  return (
    <Dialog isOpen={settingsOpen} onClose={onClose} title="Settings" className="max-w-[600px] w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-surface shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-10">
          {error && (
            <div className="p-3 text-sm text-danger bg-danger/10 rounded-md border border-danger/20">
              Failed to load settings.
            </div>
          )}

          {/* ── Appearance ── */}
          <section className="space-y-5">
            <h3 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest pl-1">Appearance</h3>
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-0.5 flex-1">
                <label htmlFor="theme" className="text-sm font-medium text-text-primary">Theme</label>
                <p className="text-[13px] text-text-secondary leading-relaxed">Choose your preferred color scheme.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 relative">
                {savedKey === 'theme' && <Check size={14} className="text-success absolute -left-5" />}
                <div className="relative">
                  <select 
                    id="theme"
                    className="appearance-none flex h-8 w-36 rounded-md border border-border bg-surface pl-3 pr-8 text-sm text-text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent hover:bg-hover"
                    value={currentTheme}
                    onChange={handleThemeChange}
                  >
                    <option value="system">System Default</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown size={14} className="text-text-tertiary" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* ── Clipboard ── */}
          <section className="space-y-5">
            <h3 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest pl-1">Clipboard History</h3>
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-0.5 flex-1">
                <label htmlFor="retention_days" className="text-sm font-medium text-text-primary">Retention Days</label>
                <p className="text-[13px] text-text-secondary leading-relaxed">Days to keep unpinned clips before auto-deletion.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 relative">
                {savedKey === 'retention_days' && <Check size={14} className="text-success absolute -left-5" />}
                <Input 
                  id="retention_days"
                  type="number" 
                  value={retentionDays} 
                  onChange={(e) => {
                    isDirty.current.retention = true;
                    setRetentionDays(e.target.value);
                  }} 
                  className="w-24 text-right h-8"
                />
              </div>
            </div>
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-0.5 flex-1">
                <label htmlFor="history_max_size" className="text-sm font-medium text-text-primary">Max History Size</label>
                <p className="text-[13px] text-text-secondary leading-relaxed">Maximum number of clips stored.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 relative">
                {savedKey === 'history_max_size' && <Check size={14} className="text-success absolute -left-5" />}
                <Input 
                  id="history_max_size"
                  type="number" 
                  value={historyMaxSize} 
                  onChange={(e) => {
                    isDirty.current.history = true;
                    setHistoryMaxSize(e.target.value);
                  }} 
                  className="w-24 text-right h-8"
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* ── Privacy ── */}
          <section className="space-y-5">
            <h3 className="text-[11px] uppercase font-bold text-text-tertiary tracking-widest pl-1">Privacy</h3>
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-0.5 flex-1">
                <label htmlFor="excluded_apps" className="text-sm font-medium text-text-primary">Excluded Apps</label>
                <p className="text-[13px] text-text-secondary leading-relaxed">Comma-separated list of apps to ignore.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 relative">
                {savedKey === 'excluded_apps' && <Check size={14} className="text-success absolute -left-5" />}
                <Input 
                  id="excluded_apps"
                  value={excludedApps} 
                  onChange={(e) => {
                    isDirty.current.apps = true;
                    setExcludedApps(e.target.value);
                  }} 
                  className="w-48 h-8"
                  placeholder="e.g. 1Password, KeePassXC"
                />
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* ── Vault ── */}
          <VaultSection />

          <hr className="border-border" />

          {/* ── Backup ── */}
          <BackupSection />
        </div>
      </div>
    </Dialog>
  );
}
