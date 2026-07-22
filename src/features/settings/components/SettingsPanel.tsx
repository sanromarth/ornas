import { useState, useEffect } from 'react';
import { Dialog } from '../../../shared/components/Dialog';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { useSettings } from '../hooks/useSettings';
import { useUIStore } from '../../../stores/ui-store';
import { BackupSection } from './BackupSection';
import { VaultSection } from '../../vault/components/VaultSection';

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { settings, isLoading, error, updateSetting } = useSettings();
  
  // Local state for edits
  const [retentionDays, setRetentionDays] = useState('');
  const [historyMaxSize, setHistoryMaxSize] = useState('');
  const [theme, setTheme] = useState('');
  const [excludedApps, setExcludedApps] = useState('');
  
  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setRetentionDays(settings.retention_days ?? '90');
      setHistoryMaxSize(settings.history_max_size ?? '10000');
      setTheme(settings.theme ?? 'system');
      setExcludedApps(settings.excluded_apps ?? '');
    }
  }, [settings]);

  // Loading/saving state
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await updateSetting({ key, value });
    } finally {
      setSavingKey(null);
    }
  };

  const { settingsOpen } = useUIStore();
  if (isLoading) return null;

  return (
    <Dialog isOpen={settingsOpen} onClose={onClose} title="Settings" className="max-w-[540px]">
      <div className="flex flex-col gap-10 max-h-[70vh] overflow-y-auto pr-2">
        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 rounded-md shrink-0">
            Failed to load settings.
          </div>
        )}

        {/* History Section */}
        <div className="flex flex-col gap-6 shrink-0">
          <h3 className="text-xs uppercase font-medium text-text-secondary tracking-wider">History</h3>
          
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="retention_days" className="text-sm font-medium text-text-primary">Retention Days</label>
                <p className="text-sm text-text-secondary leading-relaxed">Days to keep unpinned clipboard history before automatic deletion.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input 
                  id="retention_days"
                  type="number" 
                  value={retentionDays} 
                  onChange={(e) => setRetentionDays(e.target.value)} 
                  className="w-24 text-right"
                />
                <Button 
                  disabled={savingKey === 'retention_days' || retentionDays === settings?.retention_days}
                  onClick={() => handleSave('retention_days', retentionDays)}
                  loading={savingKey === 'retention_days'}
                  variant="secondary"
                >
                  Save
                </Button>
              </div>
            </div>

            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="history_max_size" className="text-sm font-medium text-text-primary">Max History Size</label>
                <p className="text-sm text-text-secondary leading-relaxed">Maximum number of clips to store in the database.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input 
                  id="history_max_size"
                  type="number" 
                  value={historyMaxSize} 
                  onChange={(e) => setHistoryMaxSize(e.target.value)} 
                  className="w-24 text-right"
                />
                <Button 
                  disabled={savingKey === 'history_max_size' || historyMaxSize === settings?.history_max_size}
                  onClick={() => handleSave('history_max_size', historyMaxSize)}
                  loading={savingKey === 'history_max_size'}
                  variant="secondary"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="flex flex-col gap-6 shrink-0">
          <h3 className="text-xs uppercase font-medium text-text-secondary tracking-wider">Appearance</h3>
          
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="theme" className="text-sm font-medium text-text-primary">Theme</label>
                <p className="text-sm text-text-secondary leading-relaxed">Choose between System, Dark, or Light color themes.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select 
                  id="theme"
                  className="flex h-9 w-32 rounded-md border border-border bg-surface px-3 py-1 text-sm text-text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent hover:bg-hover"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="system">System</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
                <Button 
                  disabled={savingKey === 'theme' || theme === settings?.theme}
                  onClick={() => handleSave('theme', theme)}
                  loading={savingKey === 'theme'}
                  variant="secondary"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Restore Section */}
        <BackupSection />

        {/* Vault Section */}
        <VaultSection />

        {/* Privacy Section */}
        <div className="flex flex-col gap-6 shrink-0">
          <h3 className="text-xs uppercase font-medium text-text-secondary tracking-wider">Privacy</h3>
          
          <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <label htmlFor="excluded_apps" className="text-sm font-medium text-text-primary">Excluded Apps</label>
                <p className="text-sm text-text-secondary leading-relaxed">Comma-separated list of app names to ignore. Copies from these apps will not be saved.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input 
                  id="excluded_apps"
                  value={excludedApps} 
                  onChange={(e) => setExcludedApps(e.target.value)} 
                  className="w-48"
                  placeholder="e.g. 1Password"
                />
                <Button 
                  disabled={savingKey === 'excluded_apps' || excludedApps === settings?.excluded_apps}
                  onClick={() => handleSave('excluded_apps', excludedApps)}
                  loading={savingKey === 'excluded_apps'}
                  variant="secondary"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
