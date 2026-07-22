import { useEffect } from 'react';
import { useUIStore } from '../stores/ui-store';
import { useVaultStore } from '../stores/vault-store';
import { Toolbar } from '../shared/layout/Toolbar';
import { useSettings } from '../features/settings/hooks/useSettings';
import { Sidebar } from '../shared/layout/Sidebar';
import { SearchBar } from '../features/search';
import { ClipboardList, ClipboardPreview } from '../features/clipboard';
import { SettingsPanel } from '../features/settings/components/SettingsPanel';

export function App() {
  const { settingsOpen, toggleSettings } = useUIStore();
  const { checkStatus } = useVaultStore();
  const { settings } = useSettings();

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const theme = settings?.theme || 'system';
    document.documentElement.setAttribute('data-theme', theme);

    // Listen for system preference changes when using "system" theme
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => document.documentElement.setAttribute('data-theme', 'system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings?.theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, toggleSettings]);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-app text-text-primary">
      <h1 className="sr-only">ORNAS Clipboard Manager</h1>
      
      {/* Left Sidebar - Collections & Tags */}
      <Sidebar />

      {/* Center Panel - History List */}
      <div className="flex flex-col h-full bg-surface border-r border-border shrink-0 w-[25%] min-w-[280px] max-w-[400px]">
        <Toolbar />
        <SearchBar />
        <ClipboardList />
      </div>

      {/* Right Panel - Preview */}
      <div className="flex flex-col flex-1 h-full bg-background min-w-[400px]">
        <ClipboardPreview />
      </div>

      {/* Global Modals */}
      <SettingsPanel onClose={toggleSettings} />
    </main>
  );
}
