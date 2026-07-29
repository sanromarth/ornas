/**
 * SettingsPanel — Native desktop preferences experience.
 *
 * Layout:
 *   Dialog (max-w-[680px], max-h-[80vh])
 *   ├── Header row (title + close)                    44px, shrink-0
 *   └── Body (flex-row)
 *       ├── Left nav (140px, shrink-0)                Category list
 *       └── Right content (flex-1, overflow-y-auto)  Active section
 *
 * Information Architecture:
 *   1. Appearance     — Theme selection
 *   2. History        — Retention days, max history size
 *   3. Privacy        — Excluded apps
 *   4. Vault          — Encryption vault setup / lock
 *   5. Backup         — Export / Import ZIP
 *   6. Shortcuts      — Keyboard reference (read-only)
 *
 * Design Principles:
 *   - Progressive disclosure: only the active section is shown
 *   - Whitespace over borders: sections separated by spacing, not <hr>
 *   - Every control has a visible, associated <label>
 *   - Saved state uses inline Check icon — no toast spam for settings
 *   - All business logic (debounce, dirty tracking, updateSetting) is preserved
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog } from '../../../shared/components/Dialog';
import { Input } from '../../../shared/components/Input';
import { useSettings } from '../hooks/useSettings';
import { useUIStore } from '../../../stores/ui-store';
import { BackupSection } from './BackupSection';
import { VaultSection } from '../../vault/components/VaultSection';
import { ExcludedAppsInput } from './ExcludedAppsInput';
import { ShortcutsSection } from './ShortcutsSection';
import { AboutSection } from './AboutSection';
import { SystemSection } from './SystemSection';
import { DiagnosticsSection } from './DiagnosticsSection';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import {
  Check, ChevronDown, Palette, Clock, Shield, Lock,
  Archive, Keyboard, Info, RotateCcw, Monitor, Activity
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

// ── Category definition ──────────────────────────────────────────────────────

type Category =
  | 'appearance'
  | 'history'
  | 'privacy'
  | 'vault'
  | 'backup'
  | 'shortcuts'
  | 'about'
  | 'system'
  | 'diagnostics';

interface CategoryDef {
  id: Category;
  label: string;
  icon: typeof Palette;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'history',    label: 'History',    icon: Clock },
  { id: 'privacy',    label: 'Privacy',    icon: Shield },
  { id: 'vault',      label: 'Vault',      icon: Lock },
  { id: 'backup',     label: 'Backup',     icon: Archive },
  { id: 'shortcuts',  label: 'Shortcuts',  icon: Keyboard },
  { id: 'about',      label: 'About',      icon: Info },
  { id: 'system',     label: 'System',     icon: Monitor },
  { id: 'diagnostics',label: 'Diagnostics',icon: Activity },
];

// ── Shared sub-components ────────────────────────────────────────────────────



/** Section title — uppercase tracking-wider, consistent with sidebar headers. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-text-tertiary tracking-wider uppercase mb-6">
      {children}
    </h3>
  );
}

/** A single settings row: label+description on left, control on right. */
function SettingRow({
  label,
  description,
  htmlFor,
  saved,
  children,
  align = 'center',
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  saved?: boolean;
  children: React.ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div className={cn('flex gap-4 justify-between', align === 'start' ? 'items-start' : 'items-center')}>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <label
          htmlFor={htmlFor}
          className={cn('text-sm font-medium text-text-primary', !htmlFor && 'cursor-default')}
        >
          {label}
        </label>
        {description && (
          <p className="text-[12px] text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      <div className={cn('shrink-0 flex items-center gap-2 relative', align === 'start' && 'mt-0.5')}>
        {saved && (
          <Check
            size={13}
            className="text-success absolute -left-5 top-1/2 -translate-y-1/2"
            aria-label="Saved"
          />
        )}
        {children}
      </div>
    </div>
  );
}

// ── Section content components ───────────────────────────────────────────────

interface SectionProps {
  settings: Record<string, string>;
  savedKey: string | null;
  updateSetting: (args: { key: string; value: string }) => void;
  showSavedIndicator: (key: string) => void;
  // Dirty tracking refs
  retentionDays: string;
  setRetentionDays: React.Dispatch<React.SetStateAction<string>>;
  historyMaxSize: string;
  setHistoryMaxSize: React.Dispatch<React.SetStateAction<string>>;
  excludedApps: string;
  setExcludedApps: React.Dispatch<React.SetStateAction<string>>;
  isDirty: React.MutableRefObject<{ retention: boolean; history: boolean; apps: boolean }>;
}

function AppearanceSection({ settings, savedKey, updateSetting, showSavedIndicator }: SectionProps) {
  const currentTheme = settings?.theme || 'system';
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSetting({ key: 'theme', value: e.target.value });
    showSavedIndicator('theme');
  };

  return (
    <div>
      <SectionTitle>Appearance</SectionTitle>
      <SettingRow
        label="Theme"
        description="Choose your preferred color scheme."
        htmlFor="theme"
        saved={savedKey === 'theme'}
      >
        <div className="relative">
          <select
            id="theme"
            className="appearance-none h-9 w-40 rounded-md border border-border bg-background pl-3 pr-8 text-sm text-text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent hover:bg-hover"
            value={currentTheme}
            onChange={handleThemeChange}
          >
            <option value="system">System Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <ChevronDown size={13} className="text-text-tertiary" />
          </div>
        </div>
      </SettingRow>
    </div>
  );
}

function HistorySection({
  savedKey,
  retentionDays, setRetentionDays,
  historyMaxSize, setHistoryMaxSize,
  isDirty,
}: SectionProps) {
  return (
    <div className="space-y-6">
      <SectionTitle>Clipboard History</SectionTitle>
      <SettingRow
        label="Retention Days"
        description="Days to keep unpinned clips before auto-deletion. Set to 0 to keep forever."
        htmlFor="retention_days"
        saved={savedKey === 'retention_days'}
      >
        <Input
          id="retention_days"
          type="number"
          value={retentionDays}
          onChange={(e) => {
            isDirty.current.retention = true;
            setRetentionDays(e.target.value);
          }}
          className="w-24 text-right"
          min="0"
          aria-describedby="retention_days_hint"
        />
      </SettingRow>
      <SettingRow
        label="Max History Size"
        description="Maximum number of clips to store. Oldest clips are removed when the limit is reached."
        htmlFor="history_max_size"
        saved={savedKey === 'history_max_size'}
      >
        <Input
          id="history_max_size"
          type="number"
          placeholder="10000"
          value={historyMaxSize}
          onChange={(e) => {
            isDirty.current.history = true;
            setHistoryMaxSize(e.target.value);
          }}
          className="w-24 text-right"
          min="1"
        />
      </SettingRow>
    </div>
  );
}

function PrivacySection({
  savedKey,
  excludedApps, setExcludedApps,
  isDirty,
}: SectionProps) {
  return (
    <div>
      <SectionTitle>Privacy</SectionTitle>
      <SettingRow
        label="Excluded Apps"
        description="ORNAS will not capture clipboard content from these applications. Type an app name and press Enter or comma."
        saved={savedKey === 'excluded_apps'}
        align="start"
      >
        <ExcludedAppsInput
          value={excludedApps}
          onChange={(val) => {
            isDirty.current.apps = true;
            setExcludedApps(val);
          }}
          placeholder="e.g. 1Password, KeePass…"
          className="w-56"
        />
      </SettingRow>
    </div>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { settings, isLoading, error, updateSetting } = useSettings();
  const settingsOpen = useUIStore((s) => s.settingsOpen);
  const activeCategory = useUIStore((s) => s.settingsCategory as Category);
  const setActiveCategory = useUIStore((s) => s.setSettingsCategory);

  // Local state for debounced text inputs
  const [retentionDays,  setRetentionDays]  = useState('');
  const [historyMaxSize, setHistoryMaxSize] = useState('');
  const [excludedApps,   setExcludedApps]   = useState('');

  // Dirty tracking — prevents overwriting user edits when settings refetch
  const isDirty = useRef({ retention: false, history: false, apps: false });

  const debouncedRetention    = useDebounce(retentionDays,  500);
  const debouncedHistorySize  = useDebounce(historyMaxSize, 500);
  const debouncedExcludedApps = useDebounce(excludedApps,   500);

  const [savedKey, setSavedKey] = useState<string | null>(null);

  const showSavedIndicator = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  };

  // Sync downward only when clean
  useEffect(() => {
    if (settings) {
      if (!isDirty.current.retention) setRetentionDays(settings.retention_days ?? '90');
      if (!isDirty.current.history)   setHistoryMaxSize(settings.history_max_size ?? '10000');
      if (!isDirty.current.apps)      setExcludedApps(settings.excluded_apps ?? '');
    }
  }, [settings]);

  // Sync upward — debounced, only when dirty and changed
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

  if (isLoading) return null;

  const sectionProps: SectionProps = {
    settings: settings ?? {},
    savedKey,
    updateSetting,
    showSavedIndicator,
    retentionDays,  setRetentionDays,
    historyMaxSize, setHistoryMaxSize,
    excludedApps,   setExcludedApps,
    isDirty,
  };

  const handleResetDefaults = async () => {
    if (confirm('Are you sure you want to reset all settings to their defaults?')) {
      await updateSetting({ key: 'theme', value: 'system' });
      await updateSetting({ key: 'retention_days', value: '90' });
      await updateSetting({ key: 'history_max_size', value: '10000' });
      await updateSetting({ key: 'excluded_apps', value: '' });
      setRetentionDays('90');
      setHistoryMaxSize('10000');
      setExcludedApps('');
      showSavedIndicator('reset');
    }
  };

  const renderSection = () => {
    switch (activeCategory) {
      case 'appearance': return <AppearanceSection {...sectionProps} />;
      case 'history':    return <HistorySection    {...sectionProps} />;
      case 'privacy':    return <PrivacySection    {...sectionProps} />;
      case 'vault':      return <VaultSection />;
      case 'backup':     return <BackupSection />;
      case 'shortcuts':  return <ShortcutsSection />;
      case 'about':      return <AboutSection />;
      case 'system':     return <SystemSection />;
      case 'diagnostics':return <DiagnosticsSection />;
    }
  };

  return (
    <Dialog
      isOpen={settingsOpen}
      onClose={onClose}
      title="Settings"
      hideClose
      className="max-w-[760px] w-[760px] h-[720px] max-h-[88vh] flex flex-col p-0 overflow-hidden"
    >
      {/* ── Dialog header ── */}
      <div className="shrink-0 flex items-center justify-between px-6 h-13 border-b border-border">
        <h2 className="text-[15px] font-semibold text-text-primary tracking-tight">Settings</h2>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-text-tertiary hover:bg-hover hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label="Close settings"
        >
          {/* × character — no icon import needed */}
          <span aria-hidden="true" className="text-lg leading-none">×</span>
        </button>
      </div>

      {/* ── Body: left nav + right content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left nav */}
        <nav
          className="shrink-0 w-44 bg-sidebar/80 flex flex-col border-r border-border overflow-y-auto py-3 px-2 space-y-1"
          aria-label="Settings categories"
        >
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={cn(
                'w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md transition-all duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring',
                activeCategory === id
                  ? 'bg-selection text-primary font-medium shadow-sm'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary',
              )}
              aria-current={activeCategory === id ? 'page' : undefined}
            >
              <Icon
                size={15}
                className={cn(
                  'shrink-0',
                  activeCategory === id ? 'text-primary' : 'text-text-tertiary',
                )}
              />
              <span className="truncate">{label}</span>
            </button>
          ))}
          
          <div className="mt-auto pt-4 mb-2">
            <button
              onClick={handleResetDefaults}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[12px] text-text-tertiary hover:text-text-primary hover:bg-hover rounded-md transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
            >
              <RotateCcw size={14} className="shrink-0" />
              <span className="truncate">Reset to Defaults</span>
              {savedKey === 'reset' && <Check size={14} className="text-success ml-auto" />}
            </button>
          </div>
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {error && (
            <div className="mx-6 mt-6 p-3 text-sm text-danger bg-danger/10 rounded-md border border-danger/20">
              Failed to load settings.
            </div>
          )}
          <div
            key={activeCategory}
            className="p-6"
            role="region"
            aria-label={CATEGORIES.find(c => c.id === activeCategory)?.label + ' settings'}
          >
            {renderSection()}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
